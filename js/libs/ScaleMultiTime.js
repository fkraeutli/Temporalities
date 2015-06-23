var ScaleMulti = function() {
	
	var baseScale = d3.time.scale();
	var scales = [ d3.time.scale() ];
	
	var me = function( value ) {
		
		for( var i = 0; i < scales.length; i++ ) {
			
			var domain = scales[ i ].domain();
			
			if ( value >= domain[ 0 ] && value <= domain[ 1 ] ) {
				
				return scales[ i ]( value );
				
			}
			
		}
		
	};
	
	function _sortScales() {
		
		scales.sort( function(a, b) { 
			
			return -( b.domain()[1] - a.domain()[1] ); 
			
		} );
		
	}
	
	me.map = function( input, output ) {
	
		var oldScale = false,
			oldDomain,
			oldRange;
		
		for( var i = 0; i < scales.length; i++ ) {
			
			oldDomain = scales[ i ].domain();
			
			if ( input > oldDomain[ 0 ] && input < oldDomain[ 1 ] ) {
				
				oldScale = scales[ i ];
				
				break;
				
			}
			
		}
		
		if ( ! oldScale ) return me;
			
		oldRange = oldScale.range();	
	
		oldScale.domain( [ oldDomain[ 0 ], input ] ).range( [ oldRange[ 0 ], output ] );
		
		scales.push( d3.time.scale().domain( [ input, oldDomain[ 1 ] ] ).range( [ output, oldRange[ 1 ] ] ) );
		
		_sortScales();
		
		return me;	
		
	};
	
	me.divisions = function(_) {
	
		var divisions = [];
		
		for( var i = 0; i < scales.length - 1; i++ ) {
			
			divisions.push( {
				
				input: scales[ i ].domain()[ 1 ],
				output: scales[ i ].range()[ 1 ],
				index: i
				
			} );
			
		}	
		
		return divisions;
		
	};
	
	me.domain = function(_) {
		
		if ( ! arguments.length ) {
			
			var min = d3.min( scales, function( d ) {
				
				return d.domain()[ 0 ];
					
			} );
			
			var max = d3.max( scales, function( d ) {
				
				return d.domain()[ 1 ];
					
			} );
			
			return [ min, max ];
			
		}
		
		baseScale.domain(_);
		
		scales[ 0 ].domain( [ baseScale.domain()[ 0 ], scales[ 0 ].domain()[ 1 ] ] );
		scales[ scales.length - 1 ].domain( [ scales[ scales.length - 1 ].domain()[ 0 ], baseScale.domain()[ 1 ] ] );
		
		return me;
	
	};

	me.invert = function( value ) {
		
		for( var i = 0; i < scales.length; i++ ) {
			
			var range = scales[ i ].range();
			
			if ( value >= range[ 0 ] && value <= range[ 1 ] ) {
				
				var scale = d3.time.scale()
					.domain( scales[ i ].range() )
					.range( scales[ i ].domain() );
				
				return scale( value );
				
			}
			
		}
	
	};
	
	me.range = function(_) {
		
		if ( ! arguments.length ) {
			
			var min = d3.min( scales, function( d ) {
				
				return d.range()[ 0 ];
					
			} );
			
			var max = d3.max( scales, function( d ) {
				
				return d.range()[ 1 ];
					
			} );
			
			return [ min, max ];
			
		}
		
		baseScale.range(_);
		
		scales[0].range( [ baseScale.range()[ 0 ], scales[ 0 ].range()[ 1 ] ] );
		scales[ scales.length - 1 ].range( [ scales[ scales.length - 1 ].range()[ 0 ], baseScale.range()[ 1 ] ] );
		
		return me;
		
	};
	
	me.scales = function() {
		
		return scales;
		
	};
	
	me.setInput = function( index, input ) {
		
		scales[ index ].domain( [ scales[ index ].domain()[ 0 ], input ] );
		
		scales[ index + 1 ].domain( [ input, scales[ index + 1 ].domain()[ 1 ] ] );
		
	};
	
	me.setOutput = function( index, output ) {
		
		scales[ index ].range( [ scales[ index ].range()[ 0 ], output ] );
		
		scales[ index + 1 ].range( [ output, scales[ index + 1 ].range()[ 1 ] ] );
		
	};
	
	me.ticks = function() {
		
		var ticks = [];
		
		for ( var i = 0; i < scales.length; i++ ) {
			
			ticks = ticks.concat( scales[ i ].ticks() );
			
		}
		
		return ticks;
		
	};
	
	return me;	
	
};