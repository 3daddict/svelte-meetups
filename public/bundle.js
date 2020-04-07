
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const meetups = writable([
        {
            id: 'm1',
            title: 'Coding Bootcamp',
            subtitle: 'Learn to code in 2 hours',
            description: 'In this meetup we have a description of things to talk about.',
            imageUrl: 'https://images.pexels.com/photos/3568521/pexels-photo-3568521.jpeg',
            address: '27th Nerd Road, 92626 California',
            contactEmail: 'code@test.com',
            isFavorite: false
        },
        {
            id: 'm2',
            title: 'Party Hard',
            subtitle: 'Pool party at my house',
            description: 'Come swim and have drinks by the pool',
            imageUrl: 'https://images.pexels.com/photos/3241804/pexels-photo-3241804.jpeg',
            address: '27th Nerd Road, 92626 California',
            contactEmail: 'pool@test.com',
            isFavorite: false
        },
    ]);

    const customMeetupStore = {
        subscribe: meetups.subscribe,
        addMeetup: (meetupData) => {
            const newMeetup = {
                ...meetupData,
                id: Math.random().toString(),
                isFavorite: false
            };
            meetups.update(items => {
                return [newMeetup, ...items]
            });
        },
        updateMeetup: (id, meetupData) => {
            meetups.update(items => {
                const meetupIndex = items.findIndex(i => i.id === id);
                const updatedMeetup = { ...items[meetupIndex], ...meetupData };
                const updatedMeetups = [...items];
                updatedMeetups[meetupIndex] = updatedMeetup;
                return updatedMeetups;
            });
        },
        removeMeetup: (id) => {
            meetups.update(items => {
                return items.filter(i => i.id !== id);
            });
        },
        toggleFavorite: (id) => {
            meetups.update(items => {
                // return a single meetup object where the id meets our extracted id
                // wrap in a spread operator to not mutate the original values. The spread operator to extract all the key/value pairs of this meetup and add them to a new object.
                const updatedMeetup = { ...items.find(m => m.id === id) };
                // create a toggle opposite of the original isFavorite value
                updatedMeetup.isFavorite = !updatedMeetup.isFavorite;
                // copy the entire array and replace the element that is updated in the array
                const meetupIndex = items.findIndex(m => m.id === id);
                const updatedMeetups = [...items];
                updatedMeetups[meetupIndex] = updatedMeetup;
                // override the exsting meetups array
                return updatedMeetups;
            });
        }
    };

    /* src/UI/Header.svelte generated by Svelte v3.18.1 */

    const file = "src/UI/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let h1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "MeetUp";
    			attr_dev(h1, "class", "svelte-18axcrr");
    			add_location(h1, file, 22, 4, 416);
    			attr_dev(header, "class", "svelte-18axcrr");
    			add_location(header, file, 21, 0, 403);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/UI/Button.svelte generated by Svelte v3.18.1 */

    const file$1 = "src/UI/Button.svelte";

    // (91:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", button_class_value = "" + (/*mode*/ ctx[2] + " " + /*color*/ ctx[3] + " svelte-g32zaw"));
    			attr_dev(button, "type", /*type*/ ctx[0]);
    			button.disabled = /*disabled*/ ctx[4];
    			add_location(button, file$1, 91, 4, 1535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    			}

    			if (!current || dirty & /*mode, color*/ 12 && button_class_value !== (button_class_value = "" + (/*mode*/ ctx[2] + " " + /*color*/ ctx[3] + " svelte-g32zaw"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*type*/ 1) {
    				attr_dev(button, "type", /*type*/ ctx[0]);
    			}

    			if (!current || dirty & /*disabled*/ 16) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(91:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (87:0) {#if href}
    function create_if_block(ctx) {
    	let a;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "href", /*href*/ ctx[1]);
    			attr_dev(a, "class", "svelte-g32zaw");
    			add_location(a, file$1, 87, 4, 1488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    			}

    			if (!current || dirty & /*href*/ 2) {
    				attr_dev(a, "href", /*href*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(87:0) {#if href}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { type = "button" } = $$props;
    	let { href = null } = $$props;
    	let { mode = null } = $$props;
    	let { color = null } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ["type", "href", "mode", "color", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("mode" in $$props) $$invalidate(2, mode = $$props.mode);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { type, href, mode, color, disabled };
    	};

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("mode" in $$props) $$invalidate(2, mode = $$props.mode);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$props.disabled);
    	};

    	return [type, href, mode, color, disabled, $$scope, $$slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment$1, safe_not_equal, {
    			type: 0,
    			href: 1,
    			mode: 2,
    			color: 3,
    			disabled: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/UI/Badge.svelte generated by Svelte v3.18.1 */

    const file$2 = "src/UI/Badge.svelte";

    function create_fragment$2(ctx) {
    	let span;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", "svelte-sjsgvq");
    			add_location(span, file$2, 14, 0, 269);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [$$scope, $$slots];
    }

    class Badge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Badge",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Meetups/MeetupItem.svelte generated by Svelte v3.18.1 */
    const file$3 = "src/Meetups/MeetupItem.svelte";

    // (83:4) {#if isFav}
    function create_if_block$1(ctx) {
    	let current;

    	const badge = new Badge({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(badge.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(badge, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(badge.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(badge.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(badge, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(83:4) {#if isFav}",
    		ctx
    	});

    	return block;
    }

    // (84:6) <Badge>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("FAVORITE");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(84:6) <Badge>",
    		ctx
    	});

    	return block;
    }

    // (97:4) <Button mode="outline" type="button" on:click={() => dispatch('edit', id)} >
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Edit");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(97:4) <Button mode=\\\"outline\\\" type=\\\"button\\\" on:click={() => dispatch('edit', id)} >",
    		ctx
    	});

    	return block;
    }

    // (98:4) <Button type="button"        mode="outline"        color="{isFav ? null : 'success'}"       on:click={toggleFavorite}>
    function create_default_slot_1(ctx) {
    	let t_value = (/*isFav*/ ctx[6] ? "UnFavorite" : "Favorite") + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*isFav*/ 64 && t_value !== (t_value = (/*isFav*/ ctx[6] ? "UnFavorite" : "Favorite") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(98:4) <Button type=\\\"button\\\"        mode=\\\"outline\\\"        color=\\\"{isFav ? null : 'success'}\\\"       on:click={toggleFavorite}>",
    		ctx
    	});

    	return block;
    }

    // (104:4) <Button type="button" on:click={() => dispatch('showdetails', id)} >
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Show Details");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(104:4) <Button type=\\\"button\\\" on:click={() => dispatch('showdetails', id)} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let article;
    	let header;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let h2;
    	let t3;
    	let t4;
    	let p0;
    	let t5;
    	let t6;
    	let div0;
    	let img;
    	let img_src_value;
    	let t7;
    	let div1;
    	let p1;
    	let t8;
    	let t9;
    	let footer;
    	let t10;
    	let t11;
    	let current;
    	let if_block = /*isFav*/ ctx[6] && create_if_block$1(ctx);

    	const button0 = new Button({
    			props: {
    				mode: "outline",
    				type: "button",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[9]);

    	const button1 = new Button({
    			props: {
    				type: "button",
    				mode: "outline",
    				color: /*isFav*/ ctx[6] ? null : "success",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*toggleFavorite*/ ctx[8]);

    	const button2 = new Button({
    			props: {
    				type: "button",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2.$on("click", /*click_handler_1*/ ctx[10]);

    	const block = {
    		c: function create() {
    			article = element("article");
    			header = element("header");
    			h1 = element("h1");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(/*subtitle*/ ctx[2]);
    			t4 = space();
    			p0 = element("p");
    			t5 = text(/*address*/ ctx[5]);
    			t6 = space();
    			div0 = element("div");
    			img = element("img");
    			t7 = space();
    			div1 = element("div");
    			p1 = element("p");
    			t8 = text(/*description*/ ctx[4]);
    			t9 = space();
    			footer = element("footer");
    			create_component(button0.$$.fragment);
    			t10 = space();
    			create_component(button1.$$.fragment);
    			t11 = space();
    			create_component(button2.$$.fragment);
    			attr_dev(h1, "class", "svelte-enhpap");
    			add_location(h1, file$3, 81, 4, 1232);
    			attr_dev(h2, "class", "svelte-enhpap");
    			add_location(h2, file$3, 86, 4, 1314);
    			attr_dev(p0, "class", "svelte-enhpap");
    			add_location(p0, file$3, 87, 4, 1338);
    			attr_dev(header, "class", "svelte-enhpap");
    			add_location(header, file$3, 80, 2, 1219);
    			attr_dev(img, "alt", /*title*/ ctx[1]);
    			if (img.src !== (img_src_value = /*imageUrl*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-enhpap");
    			add_location(img, file$3, 90, 4, 1393);
    			attr_dev(div0, "class", "image svelte-enhpap");
    			add_location(div0, file$3, 89, 2, 1369);
    			attr_dev(p1, "class", "svelte-enhpap");
    			add_location(p1, file$3, 93, 4, 1469);
    			attr_dev(div1, "class", "content svelte-enhpap");
    			add_location(div1, file$3, 92, 2, 1443);
    			attr_dev(footer, "class", "svelte-enhpap");
    			add_location(footer, file$3, 95, 2, 1501);
    			attr_dev(article, "class", "svelte-enhpap");
    			add_location(article, file$3, 79, 0, 1207);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, header);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			if (if_block) if_block.m(h1, null);
    			append_dev(header, t2);
    			append_dev(header, h2);
    			append_dev(h2, t3);
    			append_dev(header, t4);
    			append_dev(header, p0);
    			append_dev(p0, t5);
    			append_dev(article, t6);
    			append_dev(article, div0);
    			append_dev(div0, img);
    			append_dev(article, t7);
    			append_dev(article, div1);
    			append_dev(div1, p1);
    			append_dev(p1, t8);
    			append_dev(article, t9);
    			append_dev(article, footer);
    			mount_component(button0, footer, null);
    			append_dev(footer, t10);
    			mount_component(button1, footer, null);
    			append_dev(footer, t11);
    			mount_component(button2, footer, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (/*isFav*/ ctx[6]) {
    				if (!if_block) {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(h1, null);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*subtitle*/ 4) set_data_dev(t3, /*subtitle*/ ctx[2]);
    			if (!current || dirty & /*address*/ 32) set_data_dev(t5, /*address*/ ctx[5]);

    			if (!current || dirty & /*title*/ 2) {
    				attr_dev(img, "alt", /*title*/ ctx[1]);
    			}

    			if (!current || dirty & /*imageUrl*/ 8 && img.src !== (img_src_value = /*imageUrl*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*description*/ 16) set_data_dev(t8, /*description*/ ctx[4]);
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};
    			if (dirty & /*isFav*/ 64) button1_changes.color = /*isFav*/ ctx[6] ? null : "success";

    			if (dirty & /*$$scope, isFav*/ 2112) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (if_block) if_block.d();
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { id } = $$props;
    	let { title } = $$props;
    	let { subtitle } = $$props;
    	let { imageUrl } = $$props;
    	let { description } = $$props;
    	let { address } = $$props;
    	let { isFav } = $$props;
    	const dispatch = createEventDispatcher();

    	function toggleFavorite() {
    		customMeetupStore.toggleFavorite(id);
    	}

    	const writable_props = ["id", "title", "subtitle", "imageUrl", "description", "address", "isFav"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MeetupItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("edit", id);
    	const click_handler_1 = () => dispatch("showdetails", id);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("subtitle" in $$props) $$invalidate(2, subtitle = $$props.subtitle);
    		if ("imageUrl" in $$props) $$invalidate(3, imageUrl = $$props.imageUrl);
    		if ("description" in $$props) $$invalidate(4, description = $$props.description);
    		if ("address" in $$props) $$invalidate(5, address = $$props.address);
    		if ("isFav" in $$props) $$invalidate(6, isFav = $$props.isFav);
    	};

    	$$self.$capture_state = () => {
    		return {
    			id,
    			title,
    			subtitle,
    			imageUrl,
    			description,
    			address,
    			isFav
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("subtitle" in $$props) $$invalidate(2, subtitle = $$props.subtitle);
    		if ("imageUrl" in $$props) $$invalidate(3, imageUrl = $$props.imageUrl);
    		if ("description" in $$props) $$invalidate(4, description = $$props.description);
    		if ("address" in $$props) $$invalidate(5, address = $$props.address);
    		if ("isFav" in $$props) $$invalidate(6, isFav = $$props.isFav);
    	};

    	return [
    		id,
    		title,
    		subtitle,
    		imageUrl,
    		description,
    		address,
    		isFav,
    		dispatch,
    		toggleFavorite,
    		click_handler,
    		click_handler_1
    	];
    }

    class MeetupItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$3, safe_not_equal, {
    			id: 0,
    			title: 1,
    			subtitle: 2,
    			imageUrl: 3,
    			description: 4,
    			address: 5,
    			isFav: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MeetupItem",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'title'");
    		}

    		if (/*subtitle*/ ctx[2] === undefined && !("subtitle" in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'subtitle'");
    		}

    		if (/*imageUrl*/ ctx[3] === undefined && !("imageUrl" in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'imageUrl'");
    		}

    		if (/*description*/ ctx[4] === undefined && !("description" in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'description'");
    		}

    		if (/*address*/ ctx[5] === undefined && !("address" in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'address'");
    		}

    		if (/*isFav*/ ctx[6] === undefined && !("isFav" in props)) {
    			console.warn("<MeetupItem> was created without expected prop 'isFav'");
    		}
    	}

    	get id() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imageUrl() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageUrl(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get address() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set address(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFav() {
    		throw new Error("<MeetupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFav(value) {
    		throw new Error("<MeetupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Meetups/MeetupFilter.svelte generated by Svelte v3.18.1 */
    const file$4 = "src/Meetups/MeetupFilter.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "All";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Favorites";
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "svelte-1iwnzga");
    			toggle_class(button0, "active", /*selectedButton*/ ctx[0] === 0);
    			add_location(button0, file$4, 44, 4, 679);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "svelte-1iwnzga");
    			toggle_class(button1, "active", /*selectedButton*/ ctx[0] === 1);
    			add_location(button1, file$4, 51, 4, 876);
    			attr_dev(div, "class", "svelte-1iwnzga");
    			add_location(div, file$4, 43, 0, 669);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedButton*/ 1) {
    				toggle_class(button0, "active", /*selectedButton*/ ctx[0] === 0);
    			}

    			if (dirty & /*selectedButton*/ 1) {
    				toggle_class(button1, "active", /*selectedButton*/ ctx[0] === 1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let selectedButton = 0;

    	const click_handler = () => {
    		$$invalidate(0, selectedButton = 0);
    		dispatch("select", 0);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, selectedButton = 1);
    		dispatch("select", 1);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("selectedButton" in $$props) $$invalidate(0, selectedButton = $$props.selectedButton);
    	};

    	return [selectedButton, dispatch, click_handler, click_handler_1];
    }

    class MeetupFilter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MeetupFilter",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Meetups/MeetupGrid.svelte generated by Svelte v3.18.1 */
    const file$5 = "src/Meetups/MeetupGrid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (45:2) <Button on:click="{() => dispatch('add')}">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New Meetup");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(45:2) <Button on:click=\\\"{() => dispatch('add')}\\\">",
    		ctx
    	});

    	return block;
    }

    // (49:0) {#each filteredMeetups as meetup}
    function create_each_block(ctx) {
    	let current;

    	const meetupitem = new MeetupItem({
    			props: {
    				id: /*meetup*/ ctx[8].id,
    				title: /*meetup*/ ctx[8].title,
    				subtitle: /*meetup*/ ctx[8].subtitle,
    				imageUrl: /*meetup*/ ctx[8].imageUrl,
    				description: /*meetup*/ ctx[8].description,
    				email: /*meetup*/ ctx[8].contactEmail,
    				address: /*meetup*/ ctx[8].address,
    				isFav: /*meetup*/ ctx[8].isFavorite
    			},
    			$$inline: true
    		});

    	meetupitem.$on("showdetails", /*showdetails_handler*/ ctx[6]);
    	meetupitem.$on("edit", /*edit_handler*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(meetupitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(meetupitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const meetupitem_changes = {};
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.id = /*meetup*/ ctx[8].id;
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.title = /*meetup*/ ctx[8].title;
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.subtitle = /*meetup*/ ctx[8].subtitle;
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.imageUrl = /*meetup*/ ctx[8].imageUrl;
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.description = /*meetup*/ ctx[8].description;
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.email = /*meetup*/ ctx[8].contactEmail;
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.address = /*meetup*/ ctx[8].address;
    			if (dirty & /*filteredMeetups*/ 1) meetupitem_changes.isFav = /*meetup*/ ctx[8].isFavorite;
    			meetupitem.$set(meetupitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(meetupitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(meetupitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(meetupitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(49:0) {#each filteredMeetups as meetup}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let secction;
    	let t0;
    	let t1;
    	let section;
    	let current;
    	const meetupfilter = new MeetupFilter({ $$inline: true });
    	meetupfilter.$on("select", /*setFilter*/ ctx[2]);

    	const button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[5]);
    	let each_value = /*filteredMeetups*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			secction = element("secction");
    			create_component(meetupfilter.$$.fragment);
    			t0 = space();
    			create_component(button.$$.fragment);
    			t1 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(secction, "id", "meetup-controls");
    			attr_dev(secction, "class", "svelte-1iarudd");
    			add_location(secction, file$5, 41, 0, 771);
    			attr_dev(section, "id", "meetups");
    			attr_dev(section, "class", "svelte-1iarudd");
    			add_location(section, file$5, 47, 0, 923);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, secction, anchor);
    			mount_component(meetupfilter, secction, null);
    			append_dev(secction, t0);
    			mount_component(button, secction, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty & /*filteredMeetups*/ 1) {
    				each_value = /*filteredMeetups*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(meetupfilter.$$.fragment, local);
    			transition_in(button.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(meetupfilter.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(secction);
    			destroy_component(meetupfilter);
    			destroy_component(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { meetups } = $$props;
    	const dispatch = createEventDispatcher();
    	let favsOnly = false;

    	function setFilter(event) {
    		$$invalidate(4, favsOnly = event.detail === 1);
    	}

    	const writable_props = ["meetups"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MeetupGrid> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("add");

    	function showdetails_handler(event) {
    		bubble($$self, event);
    	}

    	function edit_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("meetups" in $$props) $$invalidate(3, meetups = $$props.meetups);
    	};

    	$$self.$capture_state = () => {
    		return { meetups, favsOnly, filteredMeetups };
    	};

    	$$self.$inject_state = $$props => {
    		if ("meetups" in $$props) $$invalidate(3, meetups = $$props.meetups);
    		if ("favsOnly" in $$props) $$invalidate(4, favsOnly = $$props.favsOnly);
    		if ("filteredMeetups" in $$props) $$invalidate(0, filteredMeetups = $$props.filteredMeetups);
    	};

    	let filteredMeetups;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*favsOnly, meetups*/ 24) {
    			 $$invalidate(0, filteredMeetups = favsOnly ? meetups.filter(m => m.isFavorite) : meetups);
    		}
    	};

    	return [
    		filteredMeetups,
    		dispatch,
    		setFilter,
    		meetups,
    		favsOnly,
    		click_handler,
    		showdetails_handler,
    		edit_handler
    	];
    }

    class MeetupGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, { meetups: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MeetupGrid",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*meetups*/ ctx[3] === undefined && !("meetups" in props)) {
    			console.warn("<MeetupGrid> was created without expected prop 'meetups'");
    		}
    	}

    	get meetups() {
    		throw new Error("<MeetupGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set meetups(value) {
    		throw new Error("<MeetupGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/UI/TextInput.svelte generated by Svelte v3.18.1 */

    const file$6 = "src/UI/TextInput.svelte";

    // (61:2) {:else}
    function create_else_block$1(ctx) {
    	let input;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", /*type*/ ctx[5]);
    			attr_dev(input, "id", /*id*/ ctx[2]);
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "class", "svelte-13fxmur");
    			toggle_class(input, "invalid", !/*valid*/ ctx[6] & /*touched*/ ctx[8]);
    			add_location(input, file$6, 61, 6, 1114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			dispose = [
    				listen_dev(input, "input", /*input_handler*/ ctx[9], false, false, false),
    				listen_dev(input, "blur", /*blur_handler_1*/ ctx[12], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*type*/ 32) {
    				attr_dev(input, "type", /*type*/ ctx[5]);
    			}

    			if (dirty & /*id*/ 4) {
    				attr_dev(input, "id", /*id*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty & /*valid, touched*/ 320) {
    				toggle_class(input, "invalid", !/*valid*/ ctx[6] & /*touched*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(61:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (59:2) {#if controlType === "textarea"}
    function create_if_block_1(ctx) {
    	let textarea;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "rows", /*rows*/ ctx[4]);
    			attr_dev(textarea, "id", /*id*/ ctx[2]);
    			attr_dev(textarea, "class", "svelte-13fxmur");
    			toggle_class(textarea, "invalid", !/*valid*/ ctx[6] && /*touched*/ ctx[8]);
    			add_location(textarea, file$6, 59, 6, 983);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*value*/ ctx[0]);

    			dispose = [
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[10]),
    				listen_dev(textarea, "blur", /*blur_handler*/ ctx[11], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*rows*/ 16) {
    				attr_dev(textarea, "rows", /*rows*/ ctx[4]);
    			}

    			if (dirty & /*id*/ 4) {
    				attr_dev(textarea, "id", /*id*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}

    			if (dirty & /*valid, touched*/ 320) {
    				toggle_class(textarea, "invalid", !/*valid*/ ctx[6] && /*touched*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(59:2) {#if controlType === \\\"textarea\\\"}",
    		ctx
    	});

    	return block;
    }

    // (64:2) {#if validityMessage && !valid && touched}
    function create_if_block$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*validityMessage*/ ctx[7]);
    			attr_dev(p, "class", "error-message svelte-13fxmur");
    			add_location(p, file$6, 64, 6, 1296);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*validityMessage*/ 128) set_data_dev(t, /*validityMessage*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(64:2) {#if validityMessage && !valid && touched}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let label_1;
    	let t0;
    	let t1;
    	let t2;

    	function select_block_type(ctx, dirty) {
    		if (/*controlType*/ ctx[1] === "textarea") return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*validityMessage*/ ctx[7] && !/*valid*/ ctx[6] && /*touched*/ ctx[8] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[3]);
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(label_1, "for", /*id*/ ctx[2]);
    			attr_dev(label_1, "class", "svelte-13fxmur");
    			add_location(label_1, file$6, 57, 4, 908);
    			attr_dev(div, "class", "form-control svelte-13fxmur");
    			add_location(div, file$6, 56, 0, 877);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			append_dev(label_1, t0);
    			append_dev(div, t1);
    			if_block0.m(div, null);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 8) set_data_dev(t0, /*label*/ ctx[3]);

    			if (dirty & /*id*/ 4) {
    				attr_dev(label_1, "for", /*id*/ ctx[2]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t2);
    				}
    			}

    			if (/*validityMessage*/ ctx[7] && !/*valid*/ ctx[6] && /*touched*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { controlType = null } = $$props;
    	let { id } = $$props;
    	let { label } = $$props;
    	let { rows = null } = $$props;
    	let { value } = $$props;
    	let { type = "text" } = $$props;
    	let { valid = true } = $$props;
    	let { validityMessage = "" } = $$props;
    	let touched = false;

    	const writable_props = [
    		"controlType",
    		"id",
    		"label",
    		"rows",
    		"value",
    		"type",
    		"valid",
    		"validityMessage"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	const blur_handler = () => $$invalidate(8, touched = true);
    	const blur_handler_1 = () => $$invalidate(8, touched = true);

    	$$self.$set = $$props => {
    		if ("controlType" in $$props) $$invalidate(1, controlType = $$props.controlType);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    		if ("rows" in $$props) $$invalidate(4, rows = $$props.rows);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(5, type = $$props.type);
    		if ("valid" in $$props) $$invalidate(6, valid = $$props.valid);
    		if ("validityMessage" in $$props) $$invalidate(7, validityMessage = $$props.validityMessage);
    	};

    	$$self.$capture_state = () => {
    		return {
    			controlType,
    			id,
    			label,
    			rows,
    			value,
    			type,
    			valid,
    			validityMessage,
    			touched
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("controlType" in $$props) $$invalidate(1, controlType = $$props.controlType);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    		if ("rows" in $$props) $$invalidate(4, rows = $$props.rows);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(5, type = $$props.type);
    		if ("valid" in $$props) $$invalidate(6, valid = $$props.valid);
    		if ("validityMessage" in $$props) $$invalidate(7, validityMessage = $$props.validityMessage);
    		if ("touched" in $$props) $$invalidate(8, touched = $$props.touched);
    	};

    	return [
    		value,
    		controlType,
    		id,
    		label,
    		rows,
    		type,
    		valid,
    		validityMessage,
    		touched,
    		input_handler,
    		textarea_input_handler,
    		blur_handler,
    		blur_handler_1
    	];
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {
    			controlType: 1,
    			id: 2,
    			label: 3,
    			rows: 4,
    			value: 0,
    			type: 5,
    			valid: 6,
    			validityMessage: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<TextInput> was created without expected prop 'id'");
    		}

    		if (/*label*/ ctx[3] === undefined && !("label" in props)) {
    			console.warn("<TextInput> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<TextInput> was created without expected prop 'value'");
    		}
    	}

    	get controlType() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controlType(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rows() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valid() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valid(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get validityMessage() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set validityMessage(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/UI/Modal.svelte generated by Svelte v3.18.1 */
    const file$7 = "src/UI/Modal.svelte";
    const get_footer_slot_changes = dirty => ({});
    const get_footer_slot_context = ctx => ({});

    // (69:8) <Button on:click={closeModal}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Close");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(69:8) <Button on:click={closeModal}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div0;
    	let t0;
    	let div2;
    	let h1;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let footer;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	const footer_slot_template = /*$$slots*/ ctx[3].footer;
    	const footer_slot = create_slot(footer_slot_template, ctx, /*$$scope*/ ctx[4], get_footer_slot_context);

    	const button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*closeModal*/ ctx[1]);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			h1 = element("h1");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			t3 = space();
    			footer = element("footer");

    			if (!footer_slot) {
    				create_component(button.$$.fragment);
    			}

    			if (footer_slot) footer_slot.c();
    			attr_dev(div0, "class", "modal-backdrop svelte-1lbnncu");
    			add_location(div0, file$7, 60, 0, 994);
    			attr_dev(h1, "class", "svelte-1lbnncu");
    			add_location(h1, file$7, 62, 4, 1075);
    			attr_dev(div1, "class", "content svelte-1lbnncu");
    			add_location(div1, file$7, 63, 4, 1096);
    			attr_dev(footer, "class", "svelte-1lbnncu");
    			add_location(footer, file$7, 66, 4, 1150);
    			attr_dev(div2, "class", "modal svelte-1lbnncu");
    			add_location(div2, file$7, 61, 0, 1051);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h1);
    			append_dev(h1, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append_dev(div2, t3);
    			append_dev(div2, footer);

    			if (!footer_slot) {
    				mount_component(button, footer, null);
    			}

    			if (footer_slot) {
    				footer_slot.m(footer, null);
    			}

    			current = true;
    			dispose = listen_dev(div0, "click", /*closeModal*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 16) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[4], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null));
    			}

    			if (!footer_slot) {
    				const button_changes = {};

    				if (dirty & /*$$scope*/ 16) {
    					button_changes.$$scope = { dirty, ctx };
    				}

    				button.$set(button_changes);
    			}

    			if (footer_slot && footer_slot.p && dirty & /*$$scope*/ 16) {
    				footer_slot.p(get_slot_context(footer_slot_template, ctx, /*$$scope*/ ctx[4], get_footer_slot_context), get_slot_changes(footer_slot_template, /*$$scope*/ ctx[4], dirty, get_footer_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(footer_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(footer_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);

    			if (!footer_slot) {
    				destroy_component(button);
    			}

    			if (footer_slot) footer_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	const dispatch = createEventDispatcher();

    	function closeModal() {
    		dispatch("cancel");
    	}

    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { title };
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	return [title, closeModal, dispatch, $$slots, $$scope];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Modal> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function isEmpty(val) {
        return val.trim().length === 0;
    }

    function isValidEmail() {
        return new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?").test();
    }

    /* src/Meetups/EditMeetup.svelte generated by Svelte v3.18.1 */
    const file$8 = "src/Meetups/EditMeetup.svelte";

    // (133:8) <Button mode="outline" type="button" on:click={cancel}>
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(133:8) <Button mode=\\\"outline\\\" type=\\\"button\\\" on:click={cancel}>",
    		ctx
    	});

    	return block;
    }

    // (134:8) <Button type="button" on:click={submitForm} disabled={!formIsValid} >
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(134:8) <Button type=\\\"button\\\" on:click={submitForm} disabled={!formIsValid} >",
    		ctx
    	});

    	return block;
    }

    // (135:8) {#if id}
    function create_if_block$3(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				type: "button",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*deleteMeetup*/ ctx[10]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 33554432) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(135:8) {#if id}",
    		ctx
    	});

    	return block;
    }

    // (136:12) <Button type="button" on:click={deleteMeetup} >
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(136:12) <Button type=\\\"button\\\" on:click={deleteMeetup} >",
    		ctx
    	});

    	return block;
    }

    // (132:4) <div slot="footer">
    function create_footer_slot(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;

    	const button0 = new Button({
    			props: {
    				mode: "outline",
    				type: "button",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*cancel*/ ctx[11]);

    	const button1 = new Button({
    			props: {
    				type: "button",
    				disabled: !/*formIsValid*/ ctx[8],
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*submitForm*/ ctx[9]);
    	let if_block = /*id*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "slot", "footer");
    			add_location(div, file$8, 131, 4, 4024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button0, div, null);
    			append_dev(div, t0);
    			mount_component(button1, div, null);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 33554432) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};
    			if (dirty & /*formIsValid*/ 256) button1_changes.disabled = !/*formIsValid*/ ctx[8];

    			if (dirty & /*$$scope*/ 33554432) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);

    			if (/*id*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button0);
    			destroy_component(button1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_footer_slot.name,
    		type: "slot",
    		source: "(132:4) <div slot=\\\"footer\\\">",
    		ctx
    	});

    	return block;
    }

    // (80:0) <Modal title="Edit Meetup Data" on:cancel>
    function create_default_slot$3(ctx) {
    	let form;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let updating_value;
    	let t5;
    	let current;
    	let dispose;

    	const textinput0 = new TextInput({
    			props: {
    				id: "title",
    				label: "Title",
    				valid: /*titleValid*/ ctx[7],
    				validityMessage: "Please enter a valid title.",
    				value: /*title*/ ctx[1]
    			},
    			$$inline: true
    		});

    	textinput0.$on("input", /*input_handler*/ ctx[18]);

    	const textinput1 = new TextInput({
    			props: {
    				id: "subtitle",
    				label: "Subtitle",
    				valid: /*subtitle*/ ctx[2],
    				validityMessage: "Please enter a valid response.",
    				value: /*subtitle*/ ctx[2]
    			},
    			$$inline: true
    		});

    	textinput1.$on("input", /*input_handler_1*/ ctx[19]);

    	const textinput2 = new TextInput({
    			props: {
    				id: "address",
    				label: "Address",
    				valid: /*address*/ ctx[3],
    				validityMessage: "Please enter a valid response.",
    				value: /*address*/ ctx[3]
    			},
    			$$inline: true
    		});

    	textinput2.$on("input", /*input_handler_2*/ ctx[20]);

    	const textinput3 = new TextInput({
    			props: {
    				id: "imageUrl",
    				label: "Image Url",
    				valid: /*imageUrl*/ ctx[6],
    				validityMessage: "Please enter a valid response.",
    				value: /*imageUrl*/ ctx[6]
    			},
    			$$inline: true
    		});

    	textinput3.$on("input", /*input_handler_3*/ ctx[21]);

    	const textinput4 = new TextInput({
    			props: {
    				id: "email",
    				type: "email",
    				valid: /*email*/ ctx[4],
    				validityMessage: "Please enter a valid response.",
    				label: "Email",
    				value: /*email*/ ctx[4]
    			},
    			$$inline: true
    		});

    	textinput4.$on("input", /*input_handler_4*/ ctx[22]);

    	function textinput5_value_binding(value) {
    		/*textinput5_value_binding*/ ctx[23].call(null, value);
    	}

    	let textinput5_props = {
    		id: "description",
    		controlType: "textarea",
    		label: "Description",
    		valid: /*description*/ ctx[5],
    		validityMessage: "Please enter a valid response."
    	};

    	if (/*description*/ ctx[5] !== void 0) {
    		textinput5_props.value = /*description*/ ctx[5];
    	}

    	const textinput5 = new TextInput({ props: textinput5_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput5, "value", textinput5_value_binding));

    	const block = {
    		c: function create() {
    			form = element("form");
    			create_component(textinput0.$$.fragment);
    			t0 = space();
    			create_component(textinput1.$$.fragment);
    			t1 = space();
    			create_component(textinput2.$$.fragment);
    			t2 = space();
    			create_component(textinput3.$$.fragment);
    			t3 = space();
    			create_component(textinput4.$$.fragment);
    			t4 = space();
    			create_component(textinput5.$$.fragment);
    			t5 = space();
    			attr_dev(form, "class", "svelte-xg754s");
    			add_location(form, file$8, 80, 4, 2371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			mount_component(textinput0, form, null);
    			append_dev(form, t0);
    			mount_component(textinput1, form, null);
    			append_dev(form, t1);
    			mount_component(textinput2, form, null);
    			append_dev(form, t2);
    			mount_component(textinput3, form, null);
    			append_dev(form, t3);
    			mount_component(textinput4, form, null);
    			append_dev(form, t4);
    			mount_component(textinput5, form, null);
    			insert_dev(target, t5, anchor);
    			current = true;
    			dispose = listen_dev(form, "submit", prevent_default(/*submitForm*/ ctx[9]), false, true, false);
    		},
    		p: function update(ctx, dirty) {
    			const textinput0_changes = {};
    			if (dirty & /*titleValid*/ 128) textinput0_changes.valid = /*titleValid*/ ctx[7];
    			if (dirty & /*title*/ 2) textinput0_changes.value = /*title*/ ctx[1];
    			textinput0.$set(textinput0_changes);
    			const textinput1_changes = {};
    			if (dirty & /*subtitle*/ 4) textinput1_changes.valid = /*subtitle*/ ctx[2];
    			if (dirty & /*subtitle*/ 4) textinput1_changes.value = /*subtitle*/ ctx[2];
    			textinput1.$set(textinput1_changes);
    			const textinput2_changes = {};
    			if (dirty & /*address*/ 8) textinput2_changes.valid = /*address*/ ctx[3];
    			if (dirty & /*address*/ 8) textinput2_changes.value = /*address*/ ctx[3];
    			textinput2.$set(textinput2_changes);
    			const textinput3_changes = {};
    			if (dirty & /*imageUrl*/ 64) textinput3_changes.valid = /*imageUrl*/ ctx[6];
    			if (dirty & /*imageUrl*/ 64) textinput3_changes.value = /*imageUrl*/ ctx[6];
    			textinput3.$set(textinput3_changes);
    			const textinput4_changes = {};
    			if (dirty & /*email*/ 16) textinput4_changes.valid = /*email*/ ctx[4];
    			if (dirty & /*email*/ 16) textinput4_changes.value = /*email*/ ctx[4];
    			textinput4.$set(textinput4_changes);
    			const textinput5_changes = {};
    			if (dirty & /*description*/ 32) textinput5_changes.valid = /*description*/ ctx[5];

    			if (!updating_value && dirty & /*description*/ 32) {
    				updating_value = true;
    				textinput5_changes.value = /*description*/ ctx[5];
    				add_flush_callback(() => updating_value = false);
    			}

    			textinput5.$set(textinput5_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput0.$$.fragment, local);
    			transition_in(textinput1.$$.fragment, local);
    			transition_in(textinput2.$$.fragment, local);
    			transition_in(textinput3.$$.fragment, local);
    			transition_in(textinput4.$$.fragment, local);
    			transition_in(textinput5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(textinput2.$$.fragment, local);
    			transition_out(textinput3.$$.fragment, local);
    			transition_out(textinput4.$$.fragment, local);
    			transition_out(textinput5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(textinput0);
    			destroy_component(textinput1);
    			destroy_component(textinput2);
    			destroy_component(textinput3);
    			destroy_component(textinput4);
    			destroy_component(textinput5);
    			if (detaching) detach_dev(t5);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(80:0) <Modal title=\\\"Edit Meetup Data\\\" on:cancel>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current;

    	const modal = new Modal({
    			props: {
    				title: "Edit Meetup Data",
    				$$slots: {
    					default: [create_default_slot$3],
    					footer: [create_footer_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	modal.$on("cancel", /*cancel_handler*/ ctx[24]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const modal_changes = {};

    			if (dirty & /*$$scope, id, formIsValid, description, email, imageUrl, address, subtitle, titleValid, title*/ 33554943) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { id = null } = $$props;
    	let title = "";
    	let subtitle = "";
    	let address = "";
    	let email = "";
    	let description = "";
    	let imageUrl = "";

    	if (id) {
    		const unsubscribe = customMeetupStore.subscribe(items => {
    			// Find meetup item with id
    			const selectedMeetup = items.find(i => i.id === id);

    			// Assign variables to the found meetup data
    			$$invalidate(1, title = selectedMeetup.title);

    			$$invalidate(2, subtitle = selectedMeetup.subtitle);
    			$$invalidate(3, address = selectedMeetup.address);
    			$$invalidate(4, email = selectedMeetup.contactEmail);
    			$$invalidate(5, description = selectedMeetup.description);
    			$$invalidate(6, imageUrl = selectedMeetup.imageUrl);
    		});

    		// We dont want any live updates while the user is editing the data in the modal
    		// To prevent this we unsubscribe right after fetching the data from the store
    		unsubscribe();
    	}

    	const dispatch = createEventDispatcher();

    	function submitForm() {
    		const meetupData = {
    			title,
    			subtitle,
    			description,
    			imageUrl,
    			contactEmail: email,
    			address
    		};

    		// Check if the meetup has an id
    		if (id) {
    			customMeetupStore.updateMeetup(id, meetupData);
    		} else {
    			customMeetupStore.addMeetup(meetupData);
    		}

    		dispatch("save");
    	}

    	function deleteMeetup() {
    		customMeetupStore.removeMeetup(id);
    		dispatch("save");
    	}

    	function cancel() {
    		dispatch("cancel");
    	}

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EditMeetup> was created with unknown prop '${key}'`);
    	});

    	const input_handler = event => $$invalidate(1, title = event.target.value);
    	const input_handler_1 = event => $$invalidate(2, subtitle = event.target.value);
    	const input_handler_2 = event => $$invalidate(3, address = event.target.value);
    	const input_handler_3 = event => $$invalidate(6, imageUrl = event.target.value);
    	const input_handler_4 = event => $$invalidate(4, email = event.target.value);

    	function textinput5_value_binding(value) {
    		description = value;
    		$$invalidate(5, description);
    	}

    	function cancel_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => {
    		return {
    			id,
    			title,
    			subtitle,
    			address,
    			email,
    			description,
    			imageUrl,
    			titleValid,
    			subtitleValid,
    			addressValid,
    			descriptionValid,
    			imageUrlValid,
    			emailValid,
    			formIsValid
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("subtitle" in $$props) $$invalidate(2, subtitle = $$props.subtitle);
    		if ("address" in $$props) $$invalidate(3, address = $$props.address);
    		if ("email" in $$props) $$invalidate(4, email = $$props.email);
    		if ("description" in $$props) $$invalidate(5, description = $$props.description);
    		if ("imageUrl" in $$props) $$invalidate(6, imageUrl = $$props.imageUrl);
    		if ("titleValid" in $$props) $$invalidate(7, titleValid = $$props.titleValid);
    		if ("subtitleValid" in $$props) $$invalidate(12, subtitleValid = $$props.subtitleValid);
    		if ("addressValid" in $$props) $$invalidate(13, addressValid = $$props.addressValid);
    		if ("descriptionValid" in $$props) $$invalidate(14, descriptionValid = $$props.descriptionValid);
    		if ("imageUrlValid" in $$props) $$invalidate(15, imageUrlValid = $$props.imageUrlValid);
    		if ("emailValid" in $$props) $$invalidate(16, emailValid = $$props.emailValid);
    		if ("formIsValid" in $$props) $$invalidate(8, formIsValid = $$props.formIsValid);
    	};

    	let titleValid;
    	let subtitleValid;
    	let addressValid;
    	let descriptionValid;
    	let imageUrlValid;
    	let emailValid;
    	let formIsValid;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*title*/ 2) {
    			 $$invalidate(7, titleValid = !isEmpty(title));
    		}

    		if ($$self.$$.dirty & /*subtitle*/ 4) {
    			 $$invalidate(12, subtitleValid = !isEmpty(subtitle));
    		}

    		if ($$self.$$.dirty & /*address*/ 8) {
    			 $$invalidate(13, addressValid = !isEmpty(address));
    		}

    		if ($$self.$$.dirty & /*description*/ 32) {
    			 $$invalidate(14, descriptionValid = !isEmpty(description));
    		}

    		if ($$self.$$.dirty & /*imageUrl*/ 64) {
    			 $$invalidate(15, imageUrlValid = !isEmpty(imageUrl));
    		}

    		if ($$self.$$.dirty & /*email*/ 16) {
    			 $$invalidate(16, emailValid = !isValidEmail());
    		}

    		if ($$self.$$.dirty & /*titleValid, subtitleValid, addressValid, descriptionValid, imageUrlValid, emailValid*/ 127104) {
    			 $$invalidate(8, formIsValid = titleValid && subtitleValid && addressValid && descriptionValid && imageUrlValid && emailValid);
    		}
    	};

    	return [
    		id,
    		title,
    		subtitle,
    		address,
    		email,
    		description,
    		imageUrl,
    		titleValid,
    		formIsValid,
    		submitForm,
    		deleteMeetup,
    		cancel,
    		subtitleValid,
    		addressValid,
    		descriptionValid,
    		imageUrlValid,
    		emailValid,
    		dispatch,
    		input_handler,
    		input_handler_1,
    		input_handler_2,
    		input_handler_3,
    		input_handler_4,
    		textinput5_value_binding,
    		cancel_handler
    	];
    }

    class EditMeetup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, { id: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditMeetup",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get id() {
    		throw new Error("<EditMeetup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<EditMeetup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Meetups/MeetupDetail.svelte generated by Svelte v3.18.1 */
    const file$9 = "src/Meetups/MeetupDetail.svelte";

    // (71:4) <Button href="mailto:{selectedMeetup.contactEmail}">
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Contact");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(71:4) <Button href=\\\"mailto:{selectedMeetup.contactEmail}\\\">",
    		ctx
    	});

    	return block;
    }

    // (72:4) <Button type="button" mode="outline" on:click={() => dispatch('close')}>
    function create_default_slot$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Close");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(72:4) <Button type=\\\"button\\\" mode=\\\"outline\\\" on:click={() => dispatch('close')}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let section;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div1;
    	let h1;
    	let t1_value = /*selectedMeetup*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let h2;
    	let t3_value = /*selectedMeetup*/ ctx[0].subtitle + "";
    	let t3;
    	let t4;
    	let t5_value = /*selectedMeetup*/ ctx[0].address + "";
    	let t5;
    	let t6;
    	let p;
    	let t7_value = /*selectedMeetup*/ ctx[0].description + "";
    	let t7;
    	let t8;
    	let t9;
    	let current;

    	const button0 = new Button({
    			props: {
    				href: "mailto:" + /*selectedMeetup*/ ctx[0].contactEmail,
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				type: "button",
    				mode: "outline",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = text(" - ");
    			t5 = text(t5_value);
    			t6 = space();
    			p = element("p");
    			t7 = text(t7_value);
    			t8 = space();
    			create_component(button0.$$.fragment);
    			t9 = space();
    			create_component(button1.$$.fragment);
    			if (img.src !== (img_src_value = /*selectedMeetup*/ ctx[0].imageUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*selectedMeetup*/ ctx[0].title);
    			attr_dev(img, "class", "svelte-10utsu1");
    			add_location(img, file$9, 64, 4, 931);
    			attr_dev(div0, "class", "image svelte-10utsu1");
    			add_location(div0, file$9, 63, 2, 907);
    			attr_dev(h1, "class", "svelte-10utsu1");
    			add_location(h1, file$9, 67, 4, 1033);
    			attr_dev(h2, "class", "svelte-10utsu1");
    			add_location(h2, file$9, 68, 4, 1069);
    			attr_dev(p, "class", "svelte-10utsu1");
    			add_location(p, file$9, 69, 4, 1135);
    			attr_dev(div1, "class", "content svelte-10utsu1");
    			add_location(div1, file$9, 66, 2, 1007);
    			attr_dev(section, "class", "svelte-10utsu1");
    			add_location(section, file$9, 62, 0, 895);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, img);
    			append_dev(section, t0);
    			append_dev(section, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    			append_dev(h2, t5);
    			append_dev(div1, t6);
    			append_dev(div1, p);
    			append_dev(p, t7);
    			append_dev(div1, t8);
    			mount_component(button0, div1, null);
    			append_dev(div1, t9);
    			mount_component(button1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*selectedMeetup*/ 1 && img.src !== (img_src_value = /*selectedMeetup*/ ctx[0].imageUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*selectedMeetup*/ 1 && img_alt_value !== (img_alt_value = /*selectedMeetup*/ ctx[0].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*selectedMeetup*/ 1) && t1_value !== (t1_value = /*selectedMeetup*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*selectedMeetup*/ 1) && t3_value !== (t3_value = /*selectedMeetup*/ ctx[0].subtitle + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*selectedMeetup*/ 1) && t5_value !== (t5_value = /*selectedMeetup*/ ctx[0].address + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*selectedMeetup*/ 1) && t7_value !== (t7_value = /*selectedMeetup*/ ctx[0].description + "")) set_data_dev(t7, t7_value);
    			const button0_changes = {};
    			if (dirty & /*selectedMeetup*/ 1) button0_changes.href = "mailto:" + /*selectedMeetup*/ ctx[0].contactEmail;

    			if (dirty & /*$$scope*/ 32) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { id } = $$props;
    	let selectedMeetup;

    	const unsubscribe = customMeetupStore.subscribe(items => {
    		$$invalidate(0, selectedMeetup = items.find(i => i.id === id));
    	});

    	const dispatch = createEventDispatcher();

    	onDestroy(() => {
    		unsubscribe();
    	});

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MeetupDetail> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("close");

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    	};

    	$$self.$capture_state = () => {
    		return { id, selectedMeetup };
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("selectedMeetup" in $$props) $$invalidate(0, selectedMeetup = $$props.selectedMeetup);
    	};

    	return [selectedMeetup, dispatch, id, unsubscribe, click_handler];
    }

    class MeetupDetail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, { id: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MeetupDetail",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<MeetupDetail> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<MeetupDetail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MeetupDetail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.1 */
    const file$a = "src/App.svelte";

    // (62:0) {:else}
    function create_else_block$2(ctx) {
    	let current;

    	const meetupdetail = new MeetupDetail({
    			props: { id: /*pageData*/ ctx[3].id },
    			$$inline: true
    		});

    	meetupdetail.$on("close", /*closeDetails*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(meetupdetail.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(meetupdetail, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const meetupdetail_changes = {};
    			if (dirty & /*pageData*/ 8) meetupdetail_changes.id = /*pageData*/ ctx[3].id;
    			meetupdetail.$set(meetupdetail_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(meetupdetail.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(meetupdetail.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(meetupdetail, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(62:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (52:0) {#if page === 'overview'}
    function create_if_block$4(ctx) {
    	let t;
    	let current;
    	let if_block = /*editMode*/ ctx[0] === "edit" && create_if_block_1$1(ctx);

    	const meetupgrid = new MeetupGrid({
    			props: { meetups: /*$meetups*/ ctx[4] },
    			$$inline: true
    		});

    	meetupgrid.$on("showdetails", /*showDetails*/ ctx[7]);
    	meetupgrid.$on("edit", /*startEdit*/ ctx[9]);
    	meetupgrid.$on("add", /*add_handler*/ ctx[10]);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			create_component(meetupgrid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(meetupgrid, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*editMode*/ ctx[0] === "edit") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const meetupgrid_changes = {};
    			if (dirty & /*$meetups*/ 16) meetupgrid_changes.meetups = /*$meetups*/ ctx[4];
    			meetupgrid.$set(meetupgrid_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(meetupgrid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(meetupgrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(meetupgrid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(52:0) {#if page === 'overview'}",
    		ctx
    	});

    	return block;
    }

    // (53:4) {#if editMode === 'edit'}
    function create_if_block_1$1(ctx) {
    	let current;

    	const editmeetup = new EditMeetup({
    			props: { id: /*editedId*/ ctx[1] },
    			$$inline: true
    		});

    	editmeetup.$on("save", /*savedMeetup*/ ctx[5]);
    	editmeetup.$on("cancel", /*cancelEdit*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(editmeetup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editmeetup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const editmeetup_changes = {};
    			if (dirty & /*editedId*/ 2) editmeetup_changes.id = /*editedId*/ ctx[1];
    			editmeetup.$set(editmeetup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editmeetup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editmeetup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editmeetup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(53:4) {#if editMode === 'edit'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let t;
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const header = new Header({ $$inline: true });
    	const if_block_creators = [create_if_block$4, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[2] === "overview") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t = space();
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-r5b0o4");
    			add_location(main, file$a, 50, 0, 1043);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $meetups;
    	validate_store(customMeetupStore, "meetups");
    	component_subscribe($$self, customMeetupStore, $$value => $$invalidate(4, $meetups = $$value));
    	let editMode;
    	let editedId;
    	let page = "overview";
    	let pageData = {};

    	function savedMeetup(event) {
    		$$invalidate(0, editMode = null);
    		$$invalidate(1, editedId = null);
    	}

    	function cancelEdit() {
    		$$invalidate(0, editMode = null);
    		$$invalidate(1, editedId = null);
    	}

    	function showDetails(event) {
    		$$invalidate(2, page = "details");
    		$$invalidate(3, pageData.id = event.detail, pageData);
    	}

    	function closeDetails() {
    		$$invalidate(2, page = "overview");
    		$$invalidate(3, pageData = {});
    	}

    	function startEdit(event) {
    		$$invalidate(0, editMode = "edit");
    		$$invalidate(1, editedId = event.detail);
    	}

    	const add_handler = () => {
    		$$invalidate(0, editMode = "edit");
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("editMode" in $$props) $$invalidate(0, editMode = $$props.editMode);
    		if ("editedId" in $$props) $$invalidate(1, editedId = $$props.editedId);
    		if ("page" in $$props) $$invalidate(2, page = $$props.page);
    		if ("pageData" in $$props) $$invalidate(3, pageData = $$props.pageData);
    		if ("$meetups" in $$props) customMeetupStore.set($meetups = $$props.$meetups);
    	};

    	return [
    		editMode,
    		editedId,
    		page,
    		pageData,
    		$meetups,
    		savedMeetup,
    		cancelEdit,
    		showDetails,
    		closeDetails,
    		startEdit,
    		add_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
