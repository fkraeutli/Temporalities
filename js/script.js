

function update() {
	
	function updateAxes() {
		
		if ( ! p.container.axes ) {
			
			p.container.axes = p.container.append( "g" )
				.attr( "class", "axes" );
						
		}
		
		if ( ! p.container.axes.lines ) {
			
			p.container.axes.lines = p.container.axes.append( "g" )
				.attr( "class", "lines" );
				
		}

		
		var lines = p.container.axes.lines.selectAll( "g.line" )
			.data( p.layout.axes() );
			
		linesEnter = lines.enter()
			.append( "g" )
			.attr( "class", "line" );
			
		linesEnter.append( "path" );
		linesEnter.append( "text" );
		
		lines.select( "path" )
			.transition()
			.duration( 1000 )
			.attr( "d", function( d ) { 
				
				var coor = [];
				var ret = "";
				
				for ( var i = 0; i < d.x.length; i++ ) {
					
					coor.push( [ d.x[ i ].x, d.x[ i ].index * p.view.perspective.height - p.view.perspective.height / 3 ] );
					coor.push( [ d.x[ i ].x, d.x[ i ].index * p.view.perspective.height + p.view.perspective.height / 3 ] );
					
				}
			
				for( var j = 0; j < coor.length; j++) {
					
					if ( j === 0 ) {
						
						ret += "M" + coor[ j ][ 0 ] + "," + coor[ j ][ 1 ];
						
					} else {
						
						ret += "L" + coor[ j ][ 0 ] + "," + coor[ j ][ 1 ];
						
					}
					
				}
				
				return ret;

				
			} );
			
		lines.select( "text" )
			.attr ( "x", function( d ) { 
				
				return d.x[ d.x.length - 1 ].x;
				
			} )
			.attr ( "y", function( d ) { 
				
				return d.x[ d.x.length - 1 ].index * p.view.perspective.height + p.view.perspective.height / 3;
				
			} )
			.text( function( d ) { 
				
				return new Date( +d.tick ).getFullYear();
				
			} );
			
		lines.exit().remove();
		
	}
	
	// TODO highlight only connections that are actually connected at both ends
	function updateConnections() {
			
		var connections = entries.selectAll( "g.connections" )
			.selectAll( "path" )
			.data( function( ) { 
					 
					var d = d3.select( this.parentNode.parentNode ).datum();
					
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
	
	function updateEntries() {	
		
		entries = perspectives.selectAll( "g.entry" )
			.data( function( d ) { 
				
				return d.filter( function(d) { return ! isNaN( d.x ); } ); 
				
			} );
			
		var entriesEnter = entries.enter()
			.append( "g" )
			.attr( "class", "entry" )
			.attr( "id", function( d ) { 
				
				return "entry_" + d.set_id + "_" + d.key.replace(/\W+/g, "");
				
			} )
			.on( "click", function( d ) { console.log( d ); } )
			.on( "dblclick", function( d ) { 
				
				if ( d.values[ 0 ].url ) {
					
					window.open( d.values[ 0 ].url );
				}
			} );
			
		entriesEnter.append( "g" )
			.attr( "class", "connections" );
			
		entriesEnter.append( "circle" )
			.attr( "class", "entry" );
			
		var entriesEnterLabels = entriesEnter.append( "g" )
			.attr( "class", "label" );
			
		entriesEnterLabels.append( "text" );
		
		entries.select( "g.label" )
			.attr( "transform", function( d ) { 
				
				return "translate( " + d.x + ", " + d.y + " )";
				
			} )
		.select( "text" )
			.attr( "y", function( d ) {
				
				return -d.r - 10;
				
			} )
			.html( function( d ) {
				
				return d.title;
				
			} );
			
		entries.on( "mouseover", function( d ) {
				
				function highlightConnections( d ) {
					
					if ( d.connections && d.connections.length ) {
						for ( var i = 0; i < d.connections.length; i++ ) {
					
							d.connections[ i ].target.selected = true;
					
							d3.select( "#entry_" + d.connections[ i ].target.set_id + "_" + d.connections[ i ].target.key.replace(/\W+/g, ""))
							.classed( "selected", true );
							
							highlightConnections( d.connections[ i ].target );
							
						}	
					}
				}
				
				function highlightIncoming( d ) {
					
					if ( d.incoming && d.incoming.length ) {
					
						for ( var i = 0; i < d.incoming.length; i++ ) {
						
							d.incoming[ i ].selected = true;
						
							d3.select( "#entry_" + d.incoming[ i ].set_id + "_" + d.incoming[ i ].key.replace(/\W+/g, ""))
								.classed( "selected", true );
								
							highlightIncoming( d.incoming[ i ] );
							
						}
						
					}
					
				}
				
				d.selected = true; // TODO for all
				
				d3.select( this ).classed( "selected", true );
				
				highlightIncoming( d );
				highlightConnections( d );			
				
			} )
			.on( "mouseout", function( d ) { 
				
				d.selected = false; // TODO for all
				
				d3.selectAll( ".selected" )
					.classed( "selected", false );
				
			} );
		
		entries.select( "circle.entry" )
			.transition()
			.duration( 1000 )
			.attr( "r", function( d ) {
				
				return d.r;
				
			} )
			.attr( "cx", function( d ) { 
				
				return d.x;
				
			} )
			.attr( "cy", function( d ) { 
				
				return d.y;
				
			} );
			
		entries.exit().remove();

	}
	
	function updatePerspectives() {
			
		perspectives = p.container.selectAll( ".perspective" )
			.data( p.layout.build() );
				
		perspectives.enter()
			.append( "g" )
			.attr( "class", "perspective" );
			
		perspectives.attr( "transform", function( d, i ) {
				
			return "translate( 0, " + i * p.view.perspective.height + " )";
			
		} );
		
	}
	
	var entries,
		perspectives;
	
	updatePerspectives();
	updateAxes();
	updateEntries();			
	updateConnections();
		
}
