
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
						
						if ( ! entry2.incoming ) {
							
							entry2.incoming = [];
							
						}
						
						if ( entry1.x && entry2.x  ) {
						
							entry1.connections.push(
								
								{
									x0: entry1.x,
									y0: entry1.y,
									x1: entry2.x,
									y1: entry2.y,
									index: i + 1,
									target: entry2
								}
								
							);
							
							entry2.incoming.push( entry1 );
							
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
		radiusRange = [ 2, 10 ],
		title,
		width = 600,
		scale,
		me = {},
		id = Temporalities.set.id++;
	
	me.build = function( data ) {
	
		
		if ( ! scale ) {
			
			scale = d3.scale.linear()
				.domain( [ d3.min( data, date ), d3.max( data, date ) ] )
				.range( [ 0, width ] );
			
		}
	
		data = d3.nest()
			.key( nest )
			.entries( data );
			
		rScale = d3.scale.linear()
			.domain( [ 1, d3.max( data, function( d ) { return d.values.length; } ) ] )
			.range( radiusRange );
			
		for ( var i = 0; i < data.length; i++ ) {
			
			var entry = data[ i ];
			
			entry.title = title( entry.values[ 0 ] );
			entry.date = d3.mean( entry.values, date ); // make this average or mean
			
			entry.x = scale( entry.date );
			entry.y = 0;
			entry.r = rScale( entry.values.length );
			
			entry.set_id = id;

			
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
		
		return id;
		
	};
	
	me.nest = function( _x ) {
			
		if ( ! arguments.length ) return nest;
		
		nest = _x;
		return me;
		
	};
	
	me.radius = function( _x ) {
			
		if ( ! arguments.length ) return radiusRange;
		
		radiusRange = _x;
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
	
	me.scale = function( _x ) {
			
		if ( ! arguments.length ) return scale;
		
		scale = _x;
		
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
