// FIXME
var matchingThreshold = 1,
	labelThreshold = 0;

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
					
					coor.push( [ d.x[ i ].x, p.view.padding + d.x[ i ].index * p.view.perspective.height - p.view.perspective.height / 3 ] );
					coor.push( [ d.x[ i ].x, p.view.padding + d.x[ i ].index * p.view.perspective.height + p.view.perspective.height / 3 ] );
					
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
				
				return  p.view.padding + d.x[ d.x.length - 1 ].index * p.view.perspective.height + p.view.perspective.height / 3;
				
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
				
			} )
			.attr( "class", function( d ) {
				
				return "connection_" + d.target.key.replace( /\W+/g, "" );
				
			} );
		
		connections.exit().remove();
	}
	
	function updateEntries() {	
		
		if ( perspectives.selectAll( "g.entries" ).empty() ) {
			
			perspectives.append( "g" )
				.attr( "class", "entries" );
			
		}
		
		entries = perspectives.select( "g.entries" ).selectAll( "g.entry" )
			.data( function( d ) { 
				
				return d.filter( function(d) { return ! isNaN( d.x ); } ); 
				
			} );
			
		var entriesEnter = entries.enter()
			.append( "g" )
			.attr( "class", "entry" )
			.attr( "id", function( d ) { 
				
				return getEntryId( d );
				
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
			
		entries.on( "mouseover", function( d ) {
				
				var originIDs = [];
				
				for( var i = 0; i < d.values.length; i++ ) {
					
					originIDs.push( d.values[ i ].MT_uniqueID );
					
				}
				
				function highlightConnections( d ) {
					
					if ( d.connections && d.connections.length ) {
						for ( var i = 0; i < d.connections.length; i++ ) {
					
							var targetId = d.connections[ i ].target.key.replace(/\W+/g, "");
					
							d.connections[ i ].target.selected = true;
					
							d3.select( "#entry_" + d.connections[ i ].target.set_id + "_" + targetId)
								.style( "data", function( d ) { 
									
									var thisIDs = [];
									var matches = 0;
				
									for( var i = 0; i < d.values.length; i++ ) {
					
										if (originIDs.indexOf( d.values[ i ].MT_uniqueID ) !== -1 ) {
											
											matches++;
											
										}					
									}
									d.match = matches / d.values.length;
									
									
								} )
								.classed( "selected", function( d ) { 
									
									if ( d.match >= matchingThreshold ) {
										
										return true;
									}
									
									return false;
									
								} );
							
							d3.select( "#" + getEntryId( d ) + " .connection_" + targetId ).classed( "selected", true );
							
							highlightConnections( d.connections[ i ].target );
							
						}	
					}
				}
				
				function highlightIncoming( d ) {
					
					if ( d.incoming && d.incoming.length ) {
					
						for ( var i = 0; i < d.incoming.length; i++ ) {
						
							var targetId = d.incoming[ i ].key.replace(/\W+/g, "");
						
							d.incoming[ i ].selected = true;
						
							d3.select( "#entry_" + d.incoming[ i ].set_id + "_" + targetId )			
								.style( "data", function( d ) { 
									
									var thisIDs = [];
									var matches = 0;
				
									for( var i = 0; i < d.values.length; i++ ) {
					
										if (originIDs.indexOf( d.values[ i ].MT_uniqueID ) !== -1 ) {
											
											matches++;
											
										}					
									}
									d.match = matches / d.values.length;
									
									
								} )
								.classed( "selected", function( d ) {
									
									if ( d.match >= matchingThreshold ) {
										
										return true;
									}
									
									return false;
									
								} );
								
							d3.select( "#" + getEntryId( d.incoming[ i ] ) + " .connection_" + d.key.replace(/\W+/g, "") ).classed( "selected", true );

								
							highlightIncoming( d.incoming[ i ] );
							
						}
						
					}
					
				}
				
				d.selected = true; // TODO for all
				d.match = 1;
				
				d3.select( this ).classed( "selected", true );
				
				highlightIncoming( d );
				highlightConnections( d );
				
				updateLabels();
				
			} )
			.on( "mouseout", function( d ) { 
				
				d.selected = false; // TODO for all
				
				d3.selectAll( ".entry" )
					.attr( "data-d", function ( d ) {
						
						d.match = 0;
						d.selected = false;
						
					} )
					.classed( "selected", false );
					
				updateLabels();
				
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
	
	function updateLabels() {
		
		// TODO: make customisable
		
		var lineHeight = 12,
			w = 150,
			y = 20,
			prevX = false,
			prevIndex = 0,
			indexBreak = 10;
		
		if ( perspectives.selectAll( "g.labels" ).empty() ) {
			
			perspectives.append( "g" )
				.attr( "class", "labels" );
			
		}
				
		labels = perspectives.select( "g.labels" ).selectAll( "g.label" )
			.data( function( d ) {
				
				d.sort( function ( a, b ) { return b.x - a.x; } );
				return d.filter( function(d) { return d.selected && d.match >= labelThreshold; } ); 
				
			} );
			
		var labelsEnter = labels.enter()
			.append( "g" )
			.attr( "class", "label" );			
			
		labelsEnter.append( "text" )
			.html( function( d ) {
				
				return d.title;
				
			} );
			
		labelsEnter.append( "line" );
			
		labels.select( "text" )
			.attr( "x", function(d, i) {
				
				return d.x;
				
			} )
			.attr( "y", function(d, i) {
				
			if ( i === 0 || prevX - d.x > w || prevIndex > indexBreak ) {
				
				d.labelY = d.y -y;
				prevIndex = 1;
				
			} else {
				
				d.labelY = -y - lineHeight * prevIndex;
				prevIndex ++;
				
			}
			
			prevX = d.x;
			
			return d.labelY;
						
			
			/*

						return d.labelY + p.view.works.y > lineHeight * 2 ? d.labelY : -d.labelY - y;
						
						
			*/
				
			} );
			
		labels.select( "line" )
			.attr( "x1", function( d ) { return d.x; } )
			.attr( "x2", function( d ) { return d.x; } )
			.attr( "y1", function ( d ) { return d.y; } )
			.attr( "y2", function ( d ) { return d.labelY + lineHeight / 2; } );

		labels.exit().remove();
		
	}
	
	function updatePerspectives() {
			
		perspectives = p.container.selectAll( ".perspective" )
			.data( p.layout.build() );
				
		perspectives.enter()
			.append( "g" )
			.attr( "class", "perspective" );
			
		perspectives.attr( "transform", function( d, i ) {
				
			return "translate( 0, " + ( i * p.view.perspective.height + p.view.padding )  + " )";
			
		} );
		
		captions = p.container.selectAll( "g.caption" )
			.data( p.layout.captions() );
			
		captions.enter()
			.append( "g" )
			.attr( "class", "caption" )
			.attr( "transform", function( d, i ) {
				
				return "translate( 20, " + ( i * p.view.perspective.height )  + " )";
			
			} )
		.append( "text" )
			.html( function( d ) { return d; } );	
		
	}
	
	var entries,
		perspectives;
	
	updatePerspectives();
	updateAxes();
	updateEntries();
	updateLabels();
	updateConnections();
		
}

function getEntryId( d ) {
	
	return "entry_" + d.set_id + "_" + d.key.replace(/\W+/g, "");
	
}
