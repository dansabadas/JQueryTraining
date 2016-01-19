(function () {
  $ = function (selector) {
    //if 'this' isn't correct => call new $('selector') 
    //otherwise continue as normal
    if (!(this instanceof $)) {
      return new $(selector);
    }

    // get elements from the page using selector (using document.querySelectorAll)
    // then go througheach element and copy to 'this' as a numeric property
    // and then also set a length property

    //if selector is a string
    var elements;
    if (typeof selector === 'string')
    {
      elements = document.querySelectorAll(selector); // returns an array of dom elements
    } else {
      //otherwise (assume array)
      elements = selector;
    }

    //$.__proto__ = $.prototype
    //for(var i = 0; i < elements.length; i++)
    //{
    //  this[i] = elements[i];
    //}

    //this.length = elements.length;

    //[].push(this, elements);
    Array.prototype.push.apply(this, elements); // this is the equivalent of the commented code above
  };

  var isArrayLike = function (obj) {
    if (typeof (obj.length === "number")) {
      if (obj.length === 0) {
        return true;
      } else if (obj.length > 0) {
        return (obj.length - 1) in obj;
      }
    } else {
      return false;
    }
  };
  $.extend = function (target, object) {
    for(var prop in object)   //prop will be set to a string for each property in object
    {
      if (object.hasOwnProperty(prop)) {
        target[prop] = object[prop];
      }
    }
    return target;
  }

  $.extend($, {
    isArray: function (obj) {
      return Object.prototype.toString.call(obj) === "[object Array]" // this convoluted approach is better than calling directly obj.toString() === [object Array] for a variety of reasons
    },
    each: function (collection, cb) {
      if (isArrayLike(collection)) {
        for (var i = 0; i < collection.length; i++) {
          var value = collection[i];
          cb.call(value, i, value);
        }
      } else {
        for (var prop in collection) {
          if (collection.hasOwnProperty(prop)) {
            value = collection[prop];
            cb.call(value, prop, value);
          }
        }
      }
      return collection;
    },
    makeArray: function (arr) {
      var array = [];
      $.each(arr, function (i, value) {
        array.push(value);
      });
      return array;
    },
    proxy: function (fn, context) {
      return function () {
        return fn.apply(context, arguments);
      };
    }
  });

  var makeTraverser = function (cb) {
    return function () {
      var
        elements = [],
        args = arguments;

      $.each(this, function (i, el) {
        var ret = cb.apply(el); //we want to invoke it with a context
        if(ret && isArrayLike(ret))
        {
          Array.prototype.push.apply(elements, ret);
        } else if (ret) {
          elements.push(ret);
        }
      });

      return $(elements);
    }
  }

  var getText = function (el) {
    var txt = "";
    $.each(el.childNodes, function (i, childNode) {
      if (childNode.nodeType === Node.TEXT_NODE) {   //this is text-node===3
        txt = txt + childNode.nodeValue;
      } else if (childNode.nodeType === Node.ELEMENT_NODE) {  //this is element-node===1
        txt = txt + getText(childNode);
      }
    });

    return txt;
  };

  $.extend($.prototype, {
    html: function (newHtml) {
      if (arguments.length) {
        //setting
        //go thorough each element in this and set inner Html to new Html
        //like return $.each(this, function(index, el){});
        if(arguments.length)
        {
          $.each(this, function (i, el) { // the 'this' pointer here references the preudo-array of html elements captured by the selector
            el.innerHTML = newHtml;
          });
          return this;    //this return is for chaining!
        }
      } else {
        //get this[0]'s inner HTML
        return this[0].innerHTML;
      }
    },
    val: function (newVal) {
      if (arguments.length) {
        $.each(this, function (i, el) {
          el.value = newVal;
        });
        return this;
      }
      else {
        return this[0] && this[0].value;
      }
    },
    text: function (newText) {
      if (arguments.length) {
        //setter
        //loop and set inner html of each element to ""
        //then create a textNode and append it to the element
        this.html("");
        return $.each(this, function (i, el) {
          var text = document.createTextNode(newText);
          el.appendChild(text);//adds at the end of the childnodes array
        });
      } else {
        return this[0] && getText(this[0]); // we get only the text of the first element in the jquery wrapped array
      }
    },
    find: function (selector) {
      var elements = [];
      // create accumulator
      //for each item in collection
      $.each(this, function (i, el) {
        //get elements that are within that match selector
        var els = el.querySelectorAll(selector);
        //then add them to accumulator
        Array.prototype.push.apply(elements, els);
      });

      return $(elements);
    },
    next: makeTraverser(function () {
      var current = this.nextSibling;
      while (current && current.nodeType !== 1) {
        current = current.nextSibling;
      }

      if (current) {
        return current;
      }

      //  //need our accumulator [] - where we store all elements we found
      //  //for each element in our collection
      //  //if element is not a text node => add to our accumulator
      //  //if is a text node => recurse to next  node
      //  //if nothing (no element) found => do nothing
    }),
    prev: makeTraverser(function () {
      var current = this.previousSibling;
      while (current && current.nodeType !== 1) {
        current = current.previousSibling;
      }

      if (current) {
        return current;
      }
    }),
    //parent: function(){
    //  var elements = [];
    //  $.each(this, function (i, el) {
    //    elements.push(el.parentNode);
    //  });

    //  return $(elements);
    //}
    parent: makeTraverser(function () {
      return this.parentNode;
    }),
    children: makeTraverser(function () {
      return this.children;
    }),
    attr: function (attrName, value) {
      if (arguments.length > 1) {
        return $.each(this, function (i, el) {
          el.setAttribute(attrName, value)
        });
      } else {
        return this[0] && this[0].getAttribute(attrName);
      }
    },
    css: function (cssPropName, value) {
      if (arguments.length > 1) {
        return $.each(this, function (i, el) {
          el.style[cssPropName] = value;
        });
      } else {
        return this[0] &&
          document.defaultView.getComputedStyle(this[0]).getPropertyValue(cssPropName);
      }
    },
    width: function()
    {
      var clientWidth = this[0].clientWidth;
      var leftPadding = this.css("padding-left"), //-> "10px"
          rightPadding = this.css("padding-right");

      return clientWidth - parseInt(leftPadding) - parseInt(rightPadding);
    },
    offset: function () {
      var offset = this[0].getBoundingClientRect();
      return {
        top: offset.top + window.pageYOffset, //this window.pageXYOffset calculates the scrolling pixel distance => slow in performance
        left: offset.left + window.pageXOffset
      };
    },
    hide: function () {
      this.css("display", "none");
    },
    show: function () {
      this.css("display", "");
    },

    //events
    bind: function (eventName, handler) {
      $.each(this, function (i, el) {
        el.addEventListener(eventName, handler, false);
      });
    },
    unbind: function (eventName, handler) {
      $.each(this, function (i, el) {
        el.removeEventListener(eventName, handler, false);
      })
    },
    on: function (eventType, selector, handler) {
      return this.bind(eventType, function (ev) {
        var cur = ev.target;
        do{
          if ($([cur]).has(selector).length) {
            handler.call(cur, ev);
          }
        }while(cur && cur !== ev.currentTarget)
      });
    }
  });

  $.fn = $.prototype;
}
());