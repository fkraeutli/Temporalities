var MODE_INDIVIDUAL = 1,
	MODE_UNIFORM = 2,
	MODE_OVERLAP = 3,
	mode;


switch ( window.location.hash ) {
	
	case "#uniform":
	
		mode = MODE_UNIFORM;
		break;
		
	case "#individual":
	
		mode = MODE_INDIVIDUAL;
		break;
		
	case "#overlap":
	
		mode = MODE_OVERLAP;
		break;
		
	default:
	
		mode = MODE_INDIVIDUAL;
	
}

var dataset, objects, procedures, objectHash = {};

var p = {
	
	radiusRange: [ 1.5, 10 ],
	
	view: {
		
		width: 1600,
		height: 1600,
		
		padding: 150,
		
		perspective: {
			
			height: 300
			
		}
		
	}
	
};

d3.csv("../MoDA/all_moda_governed_items.csv", function( data ) { 
	
	makeArrays( data);
	objects = data; 
	
	concatenateMoDAdata();
	
} );

d3.csv("../MoDA/all_moda_use_of_collections.csv", function( data ) { 

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
		
		var procedureDate;
		
		if ( minProcedure.procedure_begin.length <= 4 ) {
			
			procedureDate =  new Date( +minProcedure.procedure_begin, 0, 1 );
		
		} else {
		
			var pDate = minProcedure.procedure_begin.split( "/" );
			
			if ( ! pDate[2] ) {
				
				pDate[2] = pDate[1];
				pDate[1] = pDate[0];
				pDate[0] = 0;
				
			}
			
			if ( pDate[2].length <= 2) pDate[2] = "20" + pDate[2];
			
			procedureDate = new Date( pDate[2], pDate[1], pDate[0] );

						
		}
		
		minProcedure.procedure_date = procedureDate;
		
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
		
		var date;

		if ( typeof minObject.object_production_date == "object" ) {
			
			date = minObject.object_production_date[0];
			
		} else {
			
			date = minObject.object_production_date;
			
		}
		
		
		minObject.object_date = new Date( date.replace( /\D/g ,"" ), 0, 1) ;
	
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
				
				objectHash[ newObject.object_id ] = dataset.length - 1;
				
			}	
						
		}
		
		// Procedure ID
		// Procedure type
		// view-source:http://www.moda.mdx.ac.uk/moda/api?fn=fetch&id=O41378
		
	}
	
	setModaDates();
		
}

function setModaDates() {
	
	d3.csv("../MoDA/all_moda_governed_items_pdates_and_image_ids.csv", function( data ) { 
	
		for ( var i = 0; i < data.length; i++ ) {
			
			var metadata = data[i];
			
			var earliest = new Date( metadata.spec_object_production_date_field_earliest );
			var latest = new Date( metadata.spec_object_production_date_field_latest ), date;
			
			if ( ! isNaN( latest.valueOf() ) ) {
				date = new Date( earliest.valueOf() + ( latest.valueOf() - earliest.valueOf() ) / 2 );
			} else {
				date = earliest;
			}
			
			if ( dataset[ objectHash[ metadata.sys_id ] ] && dataset[ objectHash[ metadata.sys_id ] ].hasOwnProperty( "object_date" ) ) {
			
				if ( date ) {
			
					dataset[ objectHash[ metadata.sys_id ] ].object_date = date;
					dataset[ objectHash[ metadata.sys_id ] ].raw_object_earliest = metadata.spec_object_production_date_field_earliest;
					dataset[ objectHash[ metadata.sys_id ] ].raw_object_latest = metadata.spec_object_production_date_field_latest;
					
				} else {
					
					delete dataset[ objectHash[ metadata.sys_id ] ];
					
				}
				
			}
			
		}
		
		// fixes

		for( var j = 0; j < dataset.length; j++ ) {
			
			if ( dataset[j].object_id == "O50533" ) {
				
				dataset[j].object_date = new Date(1,0,1955);
				
			} else if ( dataset[j].object_id == "O46636" ) {
				
				dataset[j].object_date = new Date(2,10,1896);
				
			} else if ( dataset[j].object_id == "O47944" ) {
				
				dataset[j].object_date = new Date(31,11,1950);
				
			}
			
		}
		
		make();
		
	} );
	
	
	
}

function make() {	
	 
	var procScale, objScale;
	
	switch ( mode ) {
		
		case MODE_INDIVIDUAL:
	
			procScale = d3.time.scale()
				.domain( [ new Date( 1980, 0, 1 ), new Date( 2016, 0, 1 ) ] )
				.range( [ 0, p.view.width ] );
				
			objScale = d3.time.scale()
				.domain( [ new Date( 1800, 0, 1 ), new Date( 2016, 0, 1 ) ] )
				.range( [ 0, p.view.width ] );
				
			break;
			
		case MODE_UNIFORM:
			
			objScale = procScale = d3.time.scale()
					.domain( [ new Date( 1800, 0, 1 ), new Date( 2020, 0, 1 ) ] )
					.range( [ 0, p.view.width ] );
					
			break;
		
		case MODE_OVERLAP:
	
			procScale = d3.time.scale()
				.domain( [ new Date( 1940, 0, 1 ), new Date( 2040, 0, 1 ) ] )
				.range( [ 0, p.view.width ] );
				
			objScale = d3.time.scale()
				.domain( [ new Date( 1800, 0, 1 ), new Date( 1960, 0, 1 ) ] )
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
	
	///*
	p.layout.objects = p.layout.add()	
		.caption( "Objects" )
		.nest( function( d ) {

			return d.object_id;

		} )
		.date( function( d )  {
			
			return d.object_date;
			
		} )
		.title(
			
			function( d ) {
				
				return d.object_title || d.object_brief_description || d.object_name;
				
			}
			
		)
		.scale( objScale )
		.width( p.view.width )
		.radius( p.radiusRange );
	// */
	
	///*
	
	p.layout.categories = p.layout.add()	
		.caption( "Categories" )
		.nest( function( d ) {

			return d.object_category;

		} )
		.date( function( d )  {
			
			return d.object_date;
			
		} )
		.title(
			
			function( d ) {
				
				return d.object_category;
				
			}
			
		)
		.scale( objScale )
		.width( p.view.width )
		.radius( p.radiusRange );
		
	// */
				
	p.layout.procedures = p.layout.add()
		.caption( "Procedures" )
		.nest( function( d ) {
		
				return d.procedure_id;
		
			} )
		.date( function( d )  {
			
			return d.procedure_date;
			
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

