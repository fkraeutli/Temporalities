var dataset;

var p = {
	
	radiusRange: [ 2, 10 ],
	
	view: {
		
		width: 600,
		height: 800,
		
		perspective: {
			
			height: 150
			
		}
		
	}
	
};

d3.csv( "../brittenpoets/works_and_poets.csv", function( data ) { 
	
	dataset = [];
	fakeCycle = 1000;
	
	for( var i = 0; i < data.length; i++ ) {
		
		var work = data[ i ];
		
		work.author_id = +work.author_id;
		work.cycle_id = +work.cycle_id;
		work.day_composed = +work.day_composed;
		work.day_composed_to = +work.day_composed_to;
		work.id = +work.id;
		work.month_composed = +work.month_composed;
		work.month_composed_to = +work.month_composed_to;
		work.year_composed = +work.year_composed;
		work.year_composed_to = +work.year_composed_to;
		work.year_poet_born = +work.year_poet_born;
		work.year_poet_died = +work.year_poet_died;
		
		work.date_composed_from = new Date( work.year_composed, work.month_composed -1 || 0, work.day_composed || 0 );
		
		work.date_composed_to = new Date( work.year_composed_to, work.month_composed_to -1 || 0, work.day_composed_to || 0 );
		
		work.date_poet = new Date( 0, 0, 1 );
		
		if ( work.cycle_id == 1 || isNaN( work.cycle_id ) ) {
			
			work.cycle_id = fakeCycle++;
			
		}

		
		if ( ! work.year_poet_died ) {
			
			work.year_poet_died = new Date().getFullYear(); // set death year to current for poets who are still alive
			
		}
		
		work.date_poet.setFullYear( work.year_poet_born + ( work.year_poet_died - work.year_poet_born ) / 2 ); 
		
		if ( work.cycle_name == "none" ) {
			
			work.cycle_name = false;
			
		}
		
		if ( ! isNaN( work.date_composed_from.valueOf() ) ) {
			
			dataset.push( work );
			
		}
		
	}
	
	make();
	
} );

function make() {
	
	p.container = d3.select( "body" )
		.append( "svg" )
		.attr( "width", 800 )
		.attr( "height", 800 )
		.append( "g" )
		.attr( "transform", "translate( 10, 50 )" );
		
	p.layout = new Temporalities();
	
	p.layout.data( dataset );
	
	p.layout.cycles = p.layout.add()	
		.nest( function( d ) {

			return d.cycle_id;

		} )
		.date( function( d )  {
			
			return d.date_composed_to ? d.date_composed_from : new Date( d.date_composed_from.valueOf() + ( d.date_composed_to.valueOf() - d.date_composed_from.valueOf() ) / 2 );
			
		} )
		.title(
			
			function( d ) {
				
				return d.cycle_name;
				
			}
			
		)
		.range( p.radiusRange );
				
	p.layout.poets = p.layout.add()
		.nest( function( d ) {
		
				return d.author_id;
		
			} )
		.date( function( d )  {
			
			return d.date_poet;
			
		} )
		.title(
			
			function( d ) {
				
				return d.author_name;
				
			}
			
		)
		.width( p.view.width )
		.range( p.radiusRange );
		
	update();
	
}

function update() {
	
	var perspectives = p.container.selectAll( ".perspective" )
		.data( p.layout.build() );
			
	perspectives.enter()
		.append( "g" )
		.attr( "class", "perspective" );
		
	perspectives.attr( "transform", function( d, i ) {
			
		return "translate( 0, " + i * p.view.perspective.height + " )";
		
	} );
	
	var entries = perspectives.selectAll( "g.entry" )
		.data( function( d ) { 
			
			return d.filter( function(d) { return d.x; } ); 
			
		} );
		
	var entriesEnter = entries.enter()
		.append( "g" )
		.attr( "class", "entry" )
		.attr( "id", function( d ) { 
			
			return "entry_" + d.set_id + "_" + d.key;
			
		} )
		.on( "click", function( d ) { console.log( d ); } );
		
	
	entriesEnter.append( "circle" )
		.attr( "class", "entry" );
		
	entriesEnter.append( "g" )
		.attr( "class", "connections" );
	
	entries.selectAll( "circle.entry" )
		.transition()
		.duration( 1000 )
		.attr( "r", function() {
			
			var d = d3.select(this.parentNode).datum();
				
			return d.r;
			
		} )
		.attr( "cx", function() { 
			
			var d = d3.select(this.parentNode).datum();
			
			return d.x;
			
		} )
		.attr( "cy", function() { 
			
			var d = d3.select(this.parentNode).datum();
				
			return d.y;
			
		} );
		
	entries.exit().remove();
		
	var connections = entries.selectAll( "g.connections" )
		.selectAll( "path" )
		.data( function( ) { 
				 
				var d = d3.select(this.parentNode.parentNode).datum();
				
				return d.connections && d.connections.length ? d.connections : []; 
				
		} );
	
	connections.enter()
		.append( "path" );
		
	connections
		.transition()
		.duration( 1000 )
		.attr( "d", function ( d ) {
			
			var from = {
					
					x: d.x0,
					y: d.y0 
					
				},
				to = {
					
					x: d.x1,
					y: d.y1 + p.view.perspective.height
					
				},
				via1 = {
				
					x: from.x + ( to.x - from.x ) * 0.25,
					y: from.y + ( to.y - from.y ) * 0.33
					
				};
				via2 = {
				
					x: from.x + ( to.x - from.x ) * 0.75,
					y: from.y + ( to.y - from.y ) * 0.66
					
				};
			
			var lineFunction = d3.svg.line()
					.x( function ( d ) { return d.x; } )
					.y( function ( d ) { return d.y; } )
					.interpolate( "basis" );
					
			return lineFunction( [ from, via1, via2, to ] );
			
		} );		
	
	connections.exit().remove();
		
}

Temporalities = function() {
	
	if ( ! Temporalities.id ) Temporalities.id = 0;
	
	var id = Temporalities.id++,
		data,
		sets = [],
		setsData = [],
		updated = false;

	this.add = function() {
		
		var set = Temporalities.set();
		
		set.parent = this;
		
		sets.push( set );
		
		this.flagUpdated();
		
		return set;
		
	};
	
	
	this.build = function() {
		
		return _build();
		
	};
	
	this.data = function( _x ) {
			
		if ( ! arguments.length ) return data;
		
		data = _x;
		
		this.flagUpdated();
		
		return this;
		
	};
	
	this.flagUpdated = function() {
		
		updated = true;
		
	};
	
	this.sets = function() {
		
		return sets;
		
	};
	
	this.id = function() {
		
		return id;
		
	};
	 
	function _build() {
		
		function buildConnections( sets ) {	
					
			for ( var i = 0; i < sets.length - 1; i++ ) {
				
				var set1 = sets[ i ],
					set2 = sets[ i + 1 ],
					setsData1 = setsData[ i ],
					setsData2 = setsData[ i + 1 ];
				
				var links = [];
					
				for ( var j = 0; j < data.length; j++ ) {
					
					var record = data[ j ];
					
					var s = set1.nest()( record ) + "," + set2.nest()( record );
					
					if ( links.indexOf( s ) == -1 ) {
					
						links.push( s );
						
						var entry1 = setsData1.filter( function( d ) { return d.key == set1.nest()( record ); } )[ 0 ],
							entry2 = setsData2.filter( function( d ) { return d.key == set2.nest()( record ); } )[ 0 ];
						
						if ( ! entry1.connections ) {
							
							entry1.connections = [];
							
						}
						
						if ( entry1.x && entry2.x && entry1.y && entry2.y ) {
						
							entry1.connections.push(
								
								{
									x0: entry1.x,
									y0: entry1.y,
									x1: entry2.x,
									y1: entry2.y,
									index: i + 1
								}
								
							);
							
						}
						
					}
					
				}
				
			}
		}
					
		if ( _hasUpdated() ) {			
	
			setsData = [];
			
			for( var i = 0; i < sets.length; i++ ) {
			
				setsData.push( sets[ i ].build( data ) );
				
			}
			
			buildConnections( sets );
			
		}
		
		return setsData;
		
	}
	
	function _hasUpdated() {
		
		return updated;
		
	}
	
};

Temporalities.set = function() {
	
	if( ! Temporalities.set.id ) Temporalities.set.id = 0;
		
	var date,
		nest,
		range = [ 2, 10 ],
		title,
		width = 600,
		xScale,
		me = {};

	Temporalities.set.id++;
	
	me.build = function( data ) {
	
		
		if ( ! xScale ) {
			
			xScale = d3.scale.linear()
				.domain( [ d3.min( data, date ), d3.max( data, date ) ] )
				.range( [ 0, width ] );
			
		}
	
		data = d3.nest()
			.key( nest )
			.entries( data );
			
		rScale = d3.scale.linear()
			.domain( [ 1, d3.max( data, function( d ) { return d.values.length; } ) ] )
			.range( range );
			
			
		for ( var i = 0; i < data.length; i++ ) {
			
			var entry = data[ i ];
			
			entry.title = title( entry.values[ 0 ] );
			entry.date = d3.min( entry.values, date );
			
			entry.x = xScale( entry.date );
			entry.y = 0;
			entry.r = rScale( entry.values.length );
			
			entry.set_id = Temporalities.set.id;

			
		}
		
		data.sort( function( a, b ) { return  b.r - a.r; } );
		
		_arrange( data );
		
			
		return data;
		
	};
	
	me.date = function( _x ) {
			
		if ( ! arguments.length ) return date;
		
		date = _x;
		return me;
		
	};
	
	me.id = function() {
		
		return Temporalities.set.id;
		
	};
	
	me.nest = function( _x ) {
			
		if ( ! arguments.length ) return nest;
		
		nest = _x;
		return me;
		
	};
	
	me.range = function( _x ) {
			
		if ( ! arguments.length ) return range;
		
		range = _x;
		return me;
		
	};
	
	me.title = function( _x ) {
			
		if ( ! arguments.length ) return title;
		
		title = _x;
		return me;		
	};

	me.width = function( _x ) {
			
		if ( ! arguments.length ) return width;
		
		width = _x;
		
		_flagUpdated();
		
		return me;
		
	};
	
	me.xScale = function( _x ) {
			
		if ( ! arguments.length ) return xScale;
		
		xScale = _x;
		
		_flagUpdated();
		
		return me;
		
	};
	
	function _arrange( data ) {			
			
		function collide( node ) {
			
			var r = node.r,
				nx1 = node.x - r,
				nx2 = node.x + r,
				ny1 = node.y - r,
				ny2 = node.y + r;
				
			return function( quad, x1, y1, x2, y2 ) {
				
				if ( quad.point && ( quad.point !== node ) ) {
					
					var x = node.x - quad.point.x,
						y = node.y - quad.point.y || 1,
						l = Math.sqrt(x * x + y * y);
						
					r = node.r + quad.point.r + 3;
				
					if (l < r) {
				
						l = (l - r) / l ;
	
						node.y -= y *= l;
						quad.point.y += y;					
						
						// node.x -= x *= l / 10;
						// quad.point.x += x;
				
					}
				}
				
				return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
				
			};			
			
	
		
		}
		
		var iterations = 25;
	
		while ( --iterations ) {
	
			var i = 0,
				n = data.length,
				q = d3.geom.quadtree()
					.x( function( d ) { return d.x; } )
					.y( function( d ) { return d.y; } )
					( data );
	
			while ( ++i < n ) q.visit( collide( data[ i ] ) ) ;
	
		}
		
		
	}
	
	function _flagUpdated() {
		
		if ( me.parent ) {
		
			me.parent.flagUpdated();
		
		}
		
	}
	
	return me;

};
