var dataset;

var p = {
	
	radiusRange: [ 3, 15 ],
	
	view: {
		
		width: 1600,
		height: 800,
		
		perspective: {
			
			height: 200
			
		}
		
	}
	
};

d3.json( "../va/objects.js", function( data ) { 
	
	dataset = [];
	
	for( var i = 0; i < data.length; i++ ) {
		
		var object = data[ i ];
		
		object.fields.date_start = new Date( object.fields.date_start );
		object.fields.date_end = new Date( object.fields.date_end );	
			
			
		dataset.push( object );
		
	}
	
	dataset = dataset.filter( function( d ) { return d.fields.artist && d.fields.artist != "Unknown"; } );
	
	make();
	
} );

function make() {
	
	p.container = d3.select( "body" )
		.append( "svg" )
		.attr( "width", p.view.width )
		.attr( "height", p.view.height )
		.append( "g" )
		.attr( "transform", "translate( 10, 50 )" );
		
	p.layout = new Temporalities();
	
	p.layout.data( dataset );
	
	p.layout.objects = p.layout.add()	
		.nest( function( d ) {

			return d.fields.object;

		} )
		.date( function( d )  {
			
			return new Date( d.fields.date_start.valueOf() + ( d.fields.date_end.valueOf() - d.fields.date_start.valueOf() ) / 2 );
			
		} )
		.title(
			
			function( d ) {
				
				return d.fields.object;
				
			}
			
		)
		.range( p.radiusRange )
		.width( p.view.width );
	
	p.layout.artists = p.layout.add()	
		.nest( function( d ) {

			return d.fields.artist;

		} )
		.date( function( d )  {
			
			return new Date( d.fields.date_start.valueOf() + ( d.fields.date_end.valueOf() - d.fields.date_start.valueOf() ) / 2 );
			
		} )
		.title(
			
			function( d ) {
				
				return d.fields.artist;
				
			}
			
		)
		.range( p.radiusRange )
		.width( p.view.width );
		
	p.layout.places = p.layout.add()	
		.nest( function( d ) {

			return d.fields.place;

		} )
		.date( function( d )  {
			
			return new Date( d.fields.date_start.valueOf() + ( d.fields.date_end.valueOf() - d.fields.date_start.valueOf() ) / 2 );
			
		} )
		.title(
			
			function( d ) {
				
				return d.fields.place;
				
			}
			
		)
		.range( p.radiusRange )
		.width( p.view.width );
				
/*
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
		
	
*/
		
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
			
			return "entry_" + d.set_id + "_" + d.key.replace(/\W+/g, "");
			
		} )
		.on( "click", function( d ) { console.log( d ); } );
		
	entriesEnter.append( "g" )
		.attr( "class", "connections" );
		
	entriesEnter.append( "circle" )
		.attr( "class", "entry" );
		
	var entriesEnterLabels = entriesEnter.append( "g" )
		.attr( "class", "label" );
		
	entriesEnterLabels.append( "text" )
		.html( function( d ) {
			
			return d.title;
			
		} );
		
	entries.on( "mouseover", function( d ) {
			
			function highlightConnections( d ) {
				
				if ( d.connections && d.connections.length ) {
					for ( var i = 0; i < d.connections.length; i++ ) {
					
						d3.select( "#entry_" + d.connections[ i ].target.set_id + "_" + d.connections[ i ].target.key.replace(/\W+/g, " "))
						.classed( "selected", true );
						
						highlightConnections( d.connections[ i ].target );
						
					}	
				}
			}
			
			function highlightIncoming( d ) {
				
				if ( d.incoming && d.incoming.length ) {
				
					for ( var i = 0; i < d.incoming.length; i++ ) {
					
						d3.select( "#entry_" + d.incoming[ i ].set_id + "_" + d.incoming[ i ].key.replace(/\W+/g, " "))
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