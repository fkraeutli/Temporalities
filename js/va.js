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
		.radius( p.radiusRange )
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
		.radius( p.radiusRange )
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
		.radius( p.radiusRange )
		.width( p.view.width );
						
	update();
	
}