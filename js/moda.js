var MODE_INDIVIDUAL = 1,
	MODE_UNIFORM = 2,
	MODE_OVERLAP = 3;

var mode = MODE_UNIFORM;


var dataset, objects, procedures;

var p = {
	
	radiusRange: [ 8, 15 ],
	
	view: {
		
		width: 1600,
		height: 1600,
		
		perspective: {
			
			height: 400
			
		}
		
	}
	
};


d3.csv("../MoDA/Selected use governed items export.csv", function( data ) { 
	
	makeArrays( data);
	objects = data; 
	
	concatenateMoDAdata();
	
} );


d3.csv("../MoDA/Selected use procedure info export.csv", function( data ) { 

	makeArrays( data);
	procedures = data; 
	
	concatenateMoDAdata();

	
} );


function makeArrays( dataset ) {
	
	for ( var i = 0; i < dataset.length; i++ ) {
		
		for ( var field in dataset[ i ] ) {
			
			if ( dataset[ i ][ field ].replace(/;/g,"").length > 0) {
				
				var arr = dataset[ i ][ field ].split( ";" );
				
				if ( arr.length > 1 ) { 
					
					dataset[ i ][ field ] = arr; 
					
				}
				
			} else {
				
				dataset[ i ][ field ] = "";
				
			}
			
		}
	}
	
}

function concatenateMoDAdata() {
	
	if ( ! objects || ! procedures ) {
		
		return false;
		
	}
	
	dataset = [];
	minProcedures = {};
	
	for ( var i = 0; i < procedures.length; i++ ) {
		
		var procedure = procedures[ i ];
		
		var minProcedure = {
			
			procedure_id:		procedure["System ID"],
			procedure_edited:	procedure["Amendment history - date"],
			procedure_type:		procedure["Collections use type"],
			procedure_begin:	procedure["Procedure begin date"],
			procedure_end:		procedure["Procedure end date"],
			procedure_title:	procedure["Procedure title"],
			procedure_venue:	procedure["Venue"],
			procedure_raw:		procedure,
			
			
		};		
		
		minProcedures[ minProcedure.procedure_id ] = minProcedure;
		
	}
	
	minObjects = [];
	
	for ( var l = 0; l < objects.length; l++ ) {
		
		var object = objects[ l ];
		
		var minObject = {
			
			object_id:					object["System ID"],
			object_brief_description:	object["Brief description"],
			object_colour:				object["Colour"],
			object_comments:			object["Comment"],
			object_controller:			object["Controller"],
			object_text:				object["Label text"],
			object_material:			object["Material name"],
			object_material_note:		object["Materials & techniques note"],
			object_category:			object["Object category"],
			object_name:				object["Object name"],
			object_production_date:		object["Object production date"],
			object_production_org:		object["Object production organisation"],
			object_style:				object["Style"],
			object_title:				object["Title"],
			object_treatment_date:		object["Treatment date"],
			object_raw:					object,
			
			url:					"http://www.moda.mdx.ac.uk/" + object["URL slug"]
		};
		
		for( var j = 0; j < object["Procedure ID"].length; j++ ) {
			
			var procID = object["Procedure ID"][ j ];
			
			if ( minProcedures.hasOwnProperty( procID ) ) {
				
				var newObject = {};
									
				for( var procProp in minProcedures[ procID ] ) {
					
					newObject[ procProp ] = minProcedures[ procID ][ procProp ];
					
				}
				for( var objProp in minObject ) {
					
					newObject[ objProp ] = minObject[ objProp ];
					
				}
				
				dataset.push( newObject );
				
			}	
			
			
		}
		
		// Procedure ID
		// Procedure type
		// view-source:http://www.moda.mdx.ac.uk/moda/api?fn=fetch&id=O41378
		
	}
	
	make();
		
}

function make() {	
	 
	var procScale, objScale;
	
	switch ( mode ) {
		
		case MODE_INDIVIDUAL:
	
			procScale = d3.time.scale()
				.domain( [ new Date( 2008, 0, 1 ), new Date( 2016, 0, 1 ) ] )
				.range( [ 0, p.view.width ] );
				
			objScale = d3.time.scale()
				.domain( [ new Date( 1860, 0, 1 ), new Date( 1960, 0, 1 ) ] )
				.range( [ 0, p.view.width ] );
				
			break;
			
		case MODE_UNIFORM:
			
			objScale = procScale = d3.time.scale()
					.domain( [ new Date( 1860, 0, 1 ), new Date( 2040, 0, 1 ) ] )
					.range( [ 0, p.view.width ] );
					
			break;
		
		case MODE_OVERLAP:
	
			procScale = d3.time.scale()
				.domain( [ new Date( 1940, 0, 1 ), new Date( 2040, 0, 1 ) ] )
				.range( [ 0, p.view.width ] );
				
			objScale = d3.time.scale()
				.domain( [ new Date( 1860, 0, 1 ), new Date( 1960, 0, 1 ) ] )
				.range( [ 0, p.view.width ] );
				
			break;
			
	}

	p.container = d3.select( "body" )
		.append( "svg" )
		.attr( "width", 1600)
		.attr( "height", p.view.height )
		.append( "g" )
		.attr( "transform", "translate( 10, 50 )" );
		
	
	p.container.axes = p.container.append( "g" )
		.attr( "class", "axes" );
		
	p.layout = new Temporalities();
	
	p.layout.data( dataset );
	
	p.layout.objects = p.layout.add()	
		.nest( function( d ) {

			return d.object_id;

		} )
		.date( function( d )  {
			
			return new Date( d.object_production_date.replace( /\D/g ,"" ), 0, 1) ;
			
		} )
		.title(
			
			function( d ) {
				
				return d.object_title || d.object_name;
				
			}
			
		)
		.scale( objScale )
		.width( p.view.width )
		.radius( p.radiusRange );
				
	p.layout.procedures = p.layout.add()
		.nest( function( d ) {
		
				return d.procedure_id;
		
			} )
		.date( function( d )  {
			
			return d.procedure_begin.length > 4 ? new Date( d.procedure_begin ) : new Date( +d.procedure_begin, 0, 1 );
			
		} )
		.title(
			
			function( d ) {
				
				return d.procedure_title;
				
			}
			
		)
		.scale( procScale )
		.width( p.view.width )
		.radius( p.radiusRange );
		
	/*
	p.layout.objects = p.layout.add()	
		.nest( function( d ) {

			return d.object_id;

		} )
		.date( function( d )  {
			
			return new Date( d.object_production_date.replace( /\D/g ,"" ), 0, 1) ;
			
		} )
		.title(
			
			function( d ) {
				
				return d.object_title || d.object_name;
				
			}
			
		)
		.width( p.view.width )
		.radius( p.radiusRange );
		
		// */
		
	update();
}

