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
		.radius( p.radiusRange );
				
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
		.radius( p.radiusRange );
		
	
		
	update();
	

function make() {}
