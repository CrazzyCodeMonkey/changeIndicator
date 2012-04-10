/**
 * @summary     changeIndicator
 * @description Updates form classes to indicate field value changes
 * @file        jquery.changeIndicator.js
 * @version     1.0.1
 * @author      Trace Sinclair
**/

/**
 * Version History
 ***************************************************************************
 * 1.0.1: removed obj.keys and created methods.getKeys for IE supprt
 * 1.0.0: Intial Release
**/

(function( $ ) {
	"use strict";
	var config = {	
						/**
						 * References the object this was called on
						 * @type: a jQuery object
						 * @example:  $("form").changeIndicator()
						 * 		$(config.$self) == $("form")
						**/
						$self:null,
						
						/**
						 * name of the class to indicate a field has changed
						 * @type: string -> a CSS class name
						 * @default: no class defined
						 * @example:  $("form").changeIndicator({fieldChange:"change"});
						**/
						fieldChange:"",
						
						/**
						 * jQuery.Closest() selector to container object to apply config.fieldChange to
						 *   if left blank, config.fieldChange will be applied to the field
						 * @type: string -> CSS Selector
						 * @default: no path defined
						 * @example: $("form").changeIndicator({fieldContainer:"div.container"});
						 *  <div class="container">
						 *    <input ...>
						 *  </div>
						**/
						fieldContainer:"",
						
						/**
						 * jQuery selector to identify all fields in this object
						 * @type: string -> CSS Selector
						 * @default: :input[name]
						 *          NOTE- :input does not select disabled inputs
						 * @example: $("form").changeIndicator({fieldSelector:".jField"});
						 *  <div>
						 *    <input class="jField" ...>
						 *  </div>
						**/
						fieldSelector:":input[name]",
						
						/**
						 * jQuery selector to identify submit button(s)
						 * @type: string -> CSS Selector
						 * @default: input[type='submit'],button[type='submit']
						 * @example: $("form").changeIndicator({buttonSelector:"#submitBtn"});
						 *  <form>
						 *    ...
						 *    <input type="submit" id="submitBtn" ...>
						 *  </form>
						**/
						buttonSelector:"input[type='submit'],button[type='submit']",
						
						/**
						 * name of class to change submit button(s) to when there is a form change
						 * @type: string -> CSS class name
						 * @default: no class defined
						 * @example: $("form").changeIndicator({buttonChangeClass:"changed"});
						**/
						buttonChangeClass:"",
						
						/**
						 * Indicator to use a field with list of changed fields
						 *   if set to true a input field will be created
						 *   <input name="config.trackingFieldName" 
						 *          id="config.trackingFieldName" 
						 *          type="config.trackingFieldType" />
						 * @type: boolean
						 * @default: true
						 * @example: $("form").changeIndicator({trackingField:false});
						**/
						trackingField: true,
						
						/**
						 * name of tracking field to create if config.trackingField is true
						 * @type: string -> valid field name
						 * @default: __ChangeIndicator
						 * @example: $("form").changeIndicator({trackingFieldName:"__SomeFieldNameThatIsNotUsed"});
						**/
						trackingFieldName:"__ChangeIndicator",
						
						/**
						 * type of tracking field that will be created
						 * @type: string -> a valid input type (typically hidden|text)
						 * @default: hidden
						 * @example: $("form").changeIndicator({trackingFieldType:"text"});
						**/
						trackingFieldType:"hidden",
						
						/**
						 * indicator for debug mode
						 * @type: boolean
						 * @default: false
						 * @example: $("form").changeIndicator({debug:true});
						**/
						debug:false,
						
						/**
						 * class of class to use for debug mode
						 *   if config.debug is true, all inputs selected by 
						 *   $(config.fieldSelector) will have this class applied
						 * @type: string -> CSS class name
						 * @default: debug
						 * @example: $("form").changeIndicator({debugClass:"debugClass"});
						**/
						debugClass:"debug"};
	var methods = {
	
		/**
		 * @function: init
		 * @parameters: options - struct of config settings to change
		 * @return: this
		 * @plugin: config is updated
		 * @global: .data() elements are created for $(config.$self) an every element
		 *            selected with $(config.fieldSelector)
		 * @effect: reset listener is added to $(config.$self)
		 *         change/keyup listeners are added to $(config.fieldSelector)
		**/
		init: function(options){
			//save this for easier reference reguardless of location
			config.$self = this;
			
			//update the config settings
			config = $.extend( config, options);
			
			//create the .data() for this
			$(config.$self).data("changed",{});
			
			//get all elements
			var fieldNames = methods.getAllFieldNames($(config.$self).find(config.fieldSelector));
			
			//create the .data() for all eligable elements
			for (var f in fieldNames){
				//get the value of the field by name (checkbox/radios will return comma list of selected items)
				var sVal = methods.getFieldVal(fieldNames[f]);
				$("[name='"+fieldNames[f]+"']").each(function(){
					$(this).data("orig",sVal);
				});					
			}			
			
			//if the trackingField is enabled
			if (config.trackingField){
				//check for existing field
				if ($(config.$self).find(config.trackingFieldName).length>0){
					throw "changeIndicator: "+config.trackingFieldName+" field already exists in form";
				}
				//create the trackingField
				$(config.$self).append($("<input />")
												.attr("name",config.trackingFieldName)
												.attr("id",config.trackingFieldName)
												.attr("type",config.trackingFieldType) );
			}
			
			/**
			 * @object: config.$self
			 * @events: reset,change
			 * @description: watches for a form reset event, or a form change (triggered from a form field)
			 * @plugin: if the event is reset, this will reset the .data for config.$self
			 *          else a list of changed fields will be retrieved
			 * @effect: buttons selected by config.buttonSelector, either have class config.buttonChangeClass
			 *            added or removed, depending on if fields have been changed
			 *          all fields with class config.fieldChange will have config.fieldChange removed
			**/
			$(config.$self).on("reset change",function(event){
				//Default changeList - Nothing
				var changeList="";
				if (event.type=="reset"){ //Form Rest
					//remove all class from all changed fields
					$(config.$self).find("."+config.fieldChange).removeClass(config.fieldChange);
					//clear .data() of changed fields
					$(config.$self).data("changed",{});
				} else {
					//get the .data() of changed fields
					changeList = methods.getKeys($(config.$self).data("changed")).join(",");
				}
				
				//If using a tracking field
				if (config.trackingField){
					//update with latest changed fields
					$("#"+config.trackingFieldName).val(changeList);
				}
				
				//if any fields are changed
				if (changeList == ""){
					//apply config.buttonChangeClass to buttons identified by config.buttonSelector
					$(config.$self).find(config.buttonSelector).removeClass(config.buttonChangeClass);
				} else {
					//remove config.buttonChangeClass from buttons identified by config.buttonSelector
					$(config.$self).find(config.buttonSelector).addClass(config.buttonChangeClass);
				}
			});
			
			/**
			 * @object: fields identified by config.fieldSelector, in config.$self
			 * @events: change,keyup
			 * @description: watches for field changes
			 * @effect: if the field value == the original value
			 *            config.fieldChange is removed from the field (or container)
			 *            field name will be removed from .data() for config.$self
			 *          else
			 *            config.fieldChange is added to the field (or container)
			 *            field name will be added to .data() for config.$self
			 *          trigger change event on config.$self
			**/
			$(config.$self).on("change keyup",config.fieldSelector,function(){
				if($(this).data("orig") != methods.getFieldVal($(this).attr("name"))){
					//Field value has changed
					if (config.fieldContainer == ""){
						//add class to field
						$(this).addClass(config.fieldChange);
					} else {
						//add class to container
						$(this).closest(config.fieldContainer).addClass(config.fieldChange);
					}
					//add field name to .data() of changed fields
					var changed = $(config.$self).data("changed");
					changed[$(this).attr("name")]=true
					$(config.$self).data("changed", changed);
				} else {
					//Same as original Value
					if (config.fieldContainer == ""){
						//remove class from field
						$(this).removeClass(config.fieldChange);
					} else {
						//remove class from container
						$(this).closest(config.fieldContainer).removeClass(config.fieldChange);
					}
					//remove field name from .data() of changed fields
					var changed = $(config.$self).data("changed");
					delete changed[$(this).attr("name")];
					$(config.$self).data("changed", changed);
				}
				
				//trigger change event on config.$self
				$(config.$self).trigger("change");
			});
			return this;		
		},
		
		/**
		 * @function: getFieldVal
		 * @parameters: _fieldName - string, the name of a field
		 * @return: string - the value of the field (single value, or comma delimited list of values)
		**/
		getFieldVal: function(_fieldName){
			var aFieldVals=[];
			//Create an array of all values for this field name
			//check boxes and radio buttons have to have all checked elements returned, other field types
			//  return the full value from a single field item (including select boxes:multipe) 
			$(config.$self).find("[name='"+_fieldName+"']:checked,[name='"+_fieldName+"'][type!='radio'][type!='checkbox']").each(function(){
				aFieldVals.push($(this).val());
			});
			
			//return a comma seperated list of the value(s)
			return aFieldVals.join(",");
		},
		
		/**
		 * @function: getAllFieldNames
		 * @parameters: $fields - an array of jQuery fields
		 * @return: struct - a struct that will contain all fieldnames (distinct)
		**/
		getAllFieldNames: function($fields){
			var uFields = {};			
			$fields.each(function(){
				uFields[$(this).attr("name")] = true;
				if (config.debug)
					$(this).parent().addClass(config.debugClass);
			});			
			return methods.getKeys(uFields);
		},
		
		/**
		 * @function: getKeys
		 * @parameters: u - a struct
		 * @return: Array - an array of string that are the keys of u
		**/
		getKeys: function(u){
			var akeys = [];
			for (var k in u){
				akeys.push(k);
			}
			return akeys;
		}
	};

	/**
	 * @function: $.fn.changeIndicator
	 * @parameters: method - string or structure
	 * @return: this
	 * @description: This provides the plugin interface without cluttering the $.fn namespace
	**/
	$.fn.changeIndicator = function(method) {	
		// Method calling logic
		if ( methods[method] ) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if ( typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method '+method+' does not exist on jQuery.tooltip');
		}
	};
})( jQuery );