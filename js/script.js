var dataset;

var p = {
	
	radiusRange: [ 2, 10 ],
	
	view: {
		
		width: 600,
		height: 800,
		
		facet: {
			
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
	
	var container = d3.select( "body" )
		.append( "svg" )
		.append( "g" )
		.attr( "transform", "translate( 10, 50 )" );
		
	cycles = Temporalities.set()
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
		.width( p.view.width )
		.range( p.radiusRange );
		
	poets = Temporalities.set()
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
		
	cyclesData = cycles( dataset );
	poetsData = poets( dataset );
		
	var facets = container.selectAll( ".facet" )
		.data( [ cyclesData, poetsData ] );
			
	facets.enter()
		.append( "g" )
		.attr( "class", "facet" )
		.attr( "transform", function( d, i ) {
			
			return "translate( 0, " + i * p.view.facet.height + " )";
			
		} );
	
	facets.selectAll( "g.entry" )
		.data( function( d ) { 
			
			return d.filter( function(d) { return d.x; } ); 
		} )
		.enter()
	.append( "g" )
		.attr( "class", "entry" )
		.attr( "transform", function( d ) {
			
			return "translate(" + d.x + ", " + d.y + " )";
			
		} )
	.append( "circle" )
		.attr( "r", function( d ) {
			
			return d.r;
			
		} );
		
	d3.selectAll( "g.entry" )
		.on( "click", function( d ) { console.log( d.title ); } );
		
	var connections = Temporalities.connections()
		.data( dataset );
		
	connectionsData = connections( [ cycles, poets ] );
	
	var links = container.append( "g" )
			.attr( "id", "links" )
		.selectAll( "g.link" )
			.data( connectionsData)
		.enter()
			.append( "g" )
			.attr( "class", "link" )
			.append( "path" )
			.attr( "d", function ( d ) {
				
				var from = {
						
						x: d[ 0 ].x,
						y: d[ 0 ].y + d[ 0 ].index * p.view.facet.height
						
					},
					to = {
						
						x: d[ 1 ].x,
						y: d[ 1 ].y + d[ 1 ].index * p.view.facet.height
						
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
		
		
}

Temporalities = function() {
	
	var id = 0;
	
};

Temporalities.set = function() {
	
	if( ! Temporalities.set.id ) Temporalities.set.id = 0;
		
	var data,
		date,
		nest,
		range = [ 2, 10 ],
		rawData,
		title,
		width = 600,
		xScale;

	Temporalities.set.id++;
	
	function me( data ) {
	
		return build( data );
		
	}
	
	function build( input ) {
		
		rawData = input;
		data = input;
	
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
			
			entry.id = Temporalities.set.id;

			
		}
		
		data.sort( function( a, b ) { return  b.r - a.r; } );
		
		_arrange( data );
			
		return data;
		
	}
	
	me.data = function() {
			
		if ( ! arguments.length ) return data;
		
		return me;
		
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
		return me;
		
	};
	
	me.xScale = function( _x ) {
			
		if ( ! arguments.length ) return xScale;
		
		xScale = _x;
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
	
	return me;

};

Temporalities.connections = function() {
	
	var dataset;
	
	function me( sets ) {
		
		return build( sets );		
	}
	
	function build( sets ) {
		
		data = [];
				
		for ( var i = 0; i < sets.length - 1; i++ ) {
			
			var set1 = sets[ i ],
				set2 = sets[ i + 1 ];
			
			var links = [];
				
			for ( var j = 0; j < dataset.length; j++ ) {
				
				var record = dataset[ j ];
				
				var s = set1.nest()( record ) + "," + set2.nest()( record );

				if ( links.indexOf( s ) == -1 ) {
				
					links.push( s );
					
					var entry1 = set1.data().filter( function( d ) { return d.key == set1.nest()( record ); } )[ 0 ],
						entry2 = set2.data().filter( function( d ) { return d.key == set2.nest()( record ); } )[ 0 ];
					
					entry1.index = i;
					entry2.index = i + 1;	
						
					data.push( [ entry1, entry2	] );

					
				}
			}
		
			return data;	
				
		}
		
			
			/*
		for ( var i = 0; i < dataset.length; i++ ) {
			
			var record = dataset[ i ];
			
			var s = work.cycle_id + "," + work.author_id;
			
			if ( connections.indexOf( s ) == -1 ) {
				
				connections.push( s );
				
				var author = p.data.poets.filter( function ( d ) { return d.key == work.author_id; } )[ 0 ],
					cycle =  p.data.cycles.filter( function ( d ) { return d.key == work.cycle_id; } )[ 0 ];
					
				if ( author && cycle ) {
									
					p.data.poetsToCycles.push( { 
					
						author: author, 
									
						cycle: cycle,
						
						selections: [] 
						
					} );
				}
				
			}*/
			
	}


	
	me.data = function( _x ) {
			
		if ( ! arguments.length ) return dataset;
		
		dataset = _x;
		return me;
		
	};
	
	return me;
	
};