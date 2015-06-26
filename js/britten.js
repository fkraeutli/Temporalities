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
		
	entriesEnter.append( "g" )
		.attr( "class", "connections" );
		
	entriesEnter.append( "circle" )
		.attr( "class", "entry" );
		
	entries.on( "mouseover", function( d ) {
			
			function highlightConnections( d ) {
				
				if ( d.connections && d.connections.length ) {
					for ( var i = 0; i < d.connections.length; i++ ) {
					
						d3.select( "#entry_" + d.connections[ i ].target.set_id + "_" + d.connections[ i ].target.key)
						.classed( "selected", true );
						
						highlightConnections( d.connections[ i ].target );
						
					}	
				}
			}
			
			function highlightIncoming( d ) {
				
				if ( d.incoming && d.incoming.length ) {
				
					for ( var i = 0; i < d.incoming.length; i++ ) {
					
						d3.select( "#entry_" + d.incoming[ i ].set_id + "_" + d.incoming[ i ].key)
							.classed( "selected", true );
							
						highlightIncoming( d.incoming[ i ] );
						
					}
					
				}
				
			}
			
			d3.select( this ).classed( "selected", true );
			
			highlightIncoming( d );
			highlightConnections( d );			
			
		} )
		.on( "mouseout", function( d ) { 
			
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
