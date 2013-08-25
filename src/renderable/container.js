/*
 * MelonJS Game Engine
 * Copyright (C) 2011 - 2013, Olivier Biot, Jason Oster
 * http://www.melonjs.org
 *
 */

(function(window) {

	/**
	 * EntityContainer represents a collection of child objects
	 * @class
	 * @extends me.Renderable
	 * @memberOf me
	 * @constructor
	 * @param {Number} [x=0] position of the container
	 * @param {Number} [y=0] position of the container
	 * @param {Number} [w=me.game.viewport.width] width of the container
	 * @param {number} [h=me.game.viewport.height] height of the container
	 */

	me.ObjectContainer = me.Renderable.extend(
		/** @scope me.ObjectContainer.prototype */ {

		/**
		 * The property of entity that should be used to sort on <br>
		 * value : "x", "y", "z" (default: me.game.sortOn)
		 * @public
		 * @type String
		 * @name sortOn
		 * @memberOf me.ObjectContainer
		 */
		sortOn : "z",
		
		/** 
		 * Specify if the entity list should be automatically sorted when adding a new child
		 * @public
		 * @type Boolean
		 * @name autoSort
		 * @memberOf me.ObjectContainer
		 */
		autoSort : true,
		
		/** 
		 * keep track of pending sort
		 * @ignore
		 */
		pendingSort : null,

		/**
		 * The array of children of this container.
		 * @ignore
		 */	
		children : null,


		/** 
		 * constructor
		 * @ignore
		 */
		init : function(x, y, width, height) {
			// call the parent constructor
			this.parent(
				new me.Vector2d(x || 0, y || 0),
				width || Infinity, 
				height || Infinity 
			);
			this.children = [];
			// by default reuse the global me.game.setting
			this.sortOn = me.game.sortOn;
			this.autoSort = true;

		},


		/**
		 * Add a child to the container <br>
		 * if auto-sort is disable, the object will be appended at the bottom of the list
		 * @name addChild
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 */
		addChild : function(child) {
			if(typeof(child.ancestor) !== 'undefined') {
				child.ancestor.removeChild(child);
			}

			child.ancestor = this;
			
			this.children.push(child);
			
			this.sort(this.autoSort===false);
		},
		
		/**
		 * Add a child to the container at the specified index<br>
		 * (the list won't be sorted after insertion)
		 * @name addChildAt
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 */
		addChildAt : function(child, index) {
			if((index >= 0) && (index < this.children.length)) {
				
				if(typeof(child.ancestor) !== 'undefined') {
					child.ancestor.removeChild(child);
				}
				
				child.ancestor = this;
				
				this.children.splice(index, 0, child);
			
			} else {
				throw "melonJS (me.ObjectContainer): Index (" + index + ") Out Of Bounds for addChildAt()";
			}
		},

		/**
		 * Swaps the position (z depth) of 2 childs
		 * @name swapChildren
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 * @param {me.Renderable} child
		 */
		swapChildren : function(child, child2) {
			var index = this.getChildIndex( child );
			var index2 = this.getChildIndex( child2 );
			
			if ((index !== -1) && (index2 !== -1)) {
				
				// swap z index
				var _z = child.z;
				child.z = child2.z;
				child2.z = _z;
				// swap the positions..
				this.children[index] = child2;
				this.children[index2] = child;
				
			} else {
				throw "melonJS (me.ObjectContainer): " + child + " Both the supplied entities must be a child of the caller " + this;
			}
		},

		/**
		 * Returns the Child at the specified index
		 * @name getChildAt
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {Number} index
		 */
		getChildAt : function(index) {
			if((index >= 0) && (index < this.children.length)) {
				return this.children[index];
			} else {
				throw "melonJS (me.ObjectContainer): Index (" + index + ") Out Of Bounds for getChildAt()";
			}
		},
		
		/**
		 * Returns the index of the Child
		 * @name getChildAt
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 */
		getChildIndex : function(child) {
			return this.children.indexOf( child );
		},

		/**
		 * Returns true if contains the specified Child
		 * @name hasChild
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {String} value Value of the property
		 * @return {Boolean}
		 */
		hasChild : function(child) {
			return (this == child.ancestor);
		},
		
		/**
		 * return the child corresponding to the given property and value.<br>
		 * note : avoid calling this function every frame since
		 * it parses the whole object tree each time
		 * @name getEntityByProp
		 * @memberOf me.ObjectContainer
		 * @public
		 * @function
		 * @param {String} prop Property name
		 * @param {String} value Value of the property
		 * @return {me.Renderable[]} Array of childs
		 * @example
		 * // get the first entity called "mainPlayer" in a specific container :
		 * ent = myContainer.getEntityByProp("name", "mainPlayer");
		 * // or query the whole world :
		 * ent = me.game.world.getEntityByProp("name", "mainPlayer");
		 */
		getEntityByProp : function(prop, value)	{
			var objList = [];	
			// for string comparaisons
			var _regExp = new RegExp(value, "i");
			for (var i = this.children.length, obj; i--, obj = this.children[i];) {
				if (obj instanceof me.ObjectContainer) {
					objList = objList.concat(obj.getEntityByProp(prop, value));
				} else if (obj.isEntity) {
					if (typeof (obj[prop]) === 'string') {
						if (obj[prop].match(_regExp)) {
							objList.push(obj);
						}
					} else if (obj[prop] == value) {
						objList.push(obj);
					}
				}
			}
			return objList;
		},
		
		/**
		 * Removes (and optionally destroys) a child from the container.<br>
		 * (removal is immediate and unconditional)<br>
		 * Never use keepalive=true with objects from {@link me.entityPool}. Doing so will create a memory leak.
		 * @name removeChild
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 * @param {Boolean} keepalive True to prevent calling child.destroy()
		 */
		removeChild : function(child, keepalive) {

			if  (this.hasChild(child)) {
				
				child.ancestor = undefined;

				if (!keepalive) {
					if (typeof (child.destroy) === 'function') {
						child.destroy();
					}

					me.entityPool.freeInstance(child);
				}
				
				this.children.splice( this.getChildIndex(child), 1 );
			
			} else {
				throw "melonJS (me.ObjectContainer): " + child + " The supplied entity must be a child of the caller " + this;
			}
		},
		
		/**
		 * Move the child in the group one step forward (z depth).
		 * @name moveUp
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 */
		moveUp : function(child) {
			var childIndex = this.getChildIndex(child);
			if (childIndex -1 >= 0) {
				// note : we use an inverted loop
				this.swapChildren(child, this.getChildAt(childIndex-1));
			}
		},

		/**
		 * Move the child in the group one step backward (z depth).
		 * @name moveDown
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 */
		moveDown : function(child) {
			var childIndex = this.getChildIndex(child);
			if (childIndex+1 < this.children.length) {
				// note : we use an inverted loop
				this.swapChildren(child, this.getChildAt(childIndex+1));
			}
		},

		/**
		 * Move the specified child to the top(z depth).
		 * @name moveToTop
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 */
		moveToTop : function(child) {
			var childIndex = this.getChildIndex(child);
			if (childIndex > 0) {
				// note : we use an inverted loop
				this.splice(0, 0, this.splice(childIndex, 1)[0]);
				// increment our child z value based on the previous child depth
				child.z = this.children[1].z + 1;
			}
		},

		/**
		 * Move the specified child the bottom (z depth).
		 * @name moveToBottom
		 * @memberOf me.ObjectContainer
		 * @function
		 * @param {me.Renderable} child
		 */
		moveToBottom : function(child) {
			var childIndex = this.getChildIndex(child);
			if (childIndex < (this.children.length -1)) {
				// note : we use an inverted loop
				this.splice((this.children.length -1), 0, this.splice(childIndex, 1)[0]);
				// increment our child z value based on the next child depth
				child.z = this.children[(this.children.length -2)].z - 1;
			}
		},

		/**
		 * Manually trigger the sort of all the childs in the container</p>
		 * @name sort
		 * @memberOf me.ObjectContainer
		 * @public
		 * @function
		 */
		sort : function(force) {
			if (force===false && this.autoSort===true) {
				// don't do anything if not an "internal" call
				// and if auto-sort is enabled
				return;
			}
						
			// do nothing if there is already 
			// a previous pending sort
			if (this.pendingSort === null) {
				// trigger other child container sort function (if any)
				for (var i = this.children.length, obj; i--, obj = this.children[i];) {
					if (obj instanceof me.ObjectContainer) {
						// note : this will generate one defered sorting function
						// for each existing containe
						obj.sort(force);
					}
				}
				/** @ignore */
				this.pendingSort = (function (self) {
					// sort everything in this container
					self.children.sort(self["_sort"+self.sortOn.toUpperCase()]);
					// clear the defer id
					self.pendingSort = null;
					// make sure we redraw everything
					me.game.repaint();
				}).defer(this);
			};
		},
		
		/**
		 * Z Sorting function
		 * @ignore
		 */
		_sortZ : function (a,b) {
			return (b.z) - (a.z);
		},
		/**
		 * X Sorting function
		 * @ignore
		 */
		_sortX : function(a,b) { 
			/* ? */
			var result = (b.z - a.z);
			return (result ? result : ((b.pos && b.pos.x) - (a.pos && a.pos.x)) || 0);
		},
		/**
		 * Y Sorting function
		 * @ignore
		 */
		_sortY : function(a,b) {
			var result = (b.z - a.z);
			return (result ? result : ((b.pos && b.pos.y) - (a.pos && a.pos.y)) || 0);
		},
		
		
		/**
		 * Destroy function<br>
		 * @ignore
		 */
		destroy : function() {
			// cancel any sort operation
			if (this.pendingSort) {
				clearTimeout(this.pendingSort);
				this.pendingSort = null;
			}
			// delete all children
			for ( var i = this.children.length, obj; i--, obj = this.children[i];) {
				// don't remove it if a persistent object
				if ( !obj.isPersistent ) {
					this.removeChild(obj);
				}	
			}
		},

		/**
		 * @ignore
		 */
		update : function() {
			var isDirty = false;
			var isPaused = me.state.isPaused();
			
			for ( var i = this.children.length, obj; i--, obj = this.children[i];) {
				if (isPaused && (!obj.updateWhenPaused)) {
					// skip this object
					continue;
				}
	
				// check if object is visible
				obj.inViewport = obj.visible && (
					obj.floating || (obj.getRect && me.game.viewport.isVisible(obj))
				);
				
				// update our object
				isDirty |= (obj.inViewport || obj.alwaysUpdate) && obj.update();
			}
			return isDirty;
		},

		/**
		 * @ignore
		 */
		draw : function(context, rect) {
			this.drawCount = 0;			
			
			// translate to the container position
			context.translate(this.pos.x, this.pos.y);
			
			for ( var i = this.children.length, obj; i--, obj = this.children[i];) {
				
				if ((obj.inViewport || this.floating) && obj.isRenderable) {

					if (obj.floating==true) {
						context.save();
						// translate back object
						context.translate(
							me.game.viewport.screenX -this.pos.x, 
							me.game.viewport.screenY -this.pos.y
						);
					}

					// draw the object
					obj.draw(context, rect);

					if (obj.floating==true) {
						context.restore();
					}

					this.drawCount++;
				}
			}
			
			// translate back to origin
			context.translate(-this.pos.x, -this.pos.y);
		}

	});
	/*---------------------------------------------------------*/
	// END END END
	/*---------------------------------------------------------*/
})(window);
