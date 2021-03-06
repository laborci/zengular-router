/**
 * @property {Array<Route>} routeStorage
 * @property {Object<string, Route>} routes
 * @property {Route | null} currentRoute
 * @property {Function} errorHandler
 */
class Router {

	constructor() {
		this.routeStorage = [];
		this.routes = {};
		this.currentRoute = null;
		this.errorHandler = (location) => { console.warn('[zengular-router] No route found for ' + location); };
		window.addEventListener('popstate', () => {this.route();}, false);
	}

	/**
	 * @param {string} path
	 */
	go(path) {
		if (path.substring(0, 7) != "http://" && path.substring(0, 8) != "https://" && path[0] !== '/') path = window.location.origin + '/' + path;
		window.history.pushState({}, path, path);
		this.route();
	}

	/**
	 * @param {string} pattern
	 * @param {Function} handler
	 * @returns {Route}
	 */
	listen(pattern, handler) {
		let route = new Route(pattern, handler);
		route.router = this;
		this.routeStorage.push(route);
		return route;
	}

	/**
	 * @param {Function} handler
	 */
	error(handler) { this.errorHandler = handler;}

	route() {
		if (!this.routeStorage.some(routeListener => routeListener.route(window.location))) {
			this.errorHandler(window.location);
		}
	}

	/**
	 * @param {Object<string, Route>} routes
	 */
	setup(routes) {
		for (let name in routes) if (routes.hasOwnProperty(name)) {
			let route = routes[name];
			if (typeof route === 'string') {
				route = new Route(route);
				routes[name] = route;
			}
			route.router = this;
			this.routeStorage.push(route);
			route.as(name);
		}
	}


	addClickEventListener() {
		document.body.addEventListener('click', (event) => {
			let closest = event.target.closest("[data-go-to-route]");
			if (closest) this.routes[closest.dataset.goToRoute].go(closest.dataset);
		});
	}
}

/**
 * @property {string|null} name
 * @property {Router|null} router
 * @property {string} pattern
 * @property {RegExp} routePattern
 * @property {Function|null} handler
 * @property {Array<string>} varNames
 * @property {Object<string, string>} vars
 */
class Route {

	/**
	 * @param {string} pattern
	 * @param {Function} handler
	 * @param {Router} router
	 */
	constructor(pattern, handler = null) {
		this.name = null;
		this.router = null;
		this.pattern = pattern;
		this.routePattern = new RegExp(pattern.replace(/{(.*?)}/gm, '(.*?)') + "$");
		this.handler = handler;
		this.varNames = [];
		let match;
		while ((match = /{(.*?)}/gm.exec(pattern)) !== null) {
			this.varNames.push(match[1]);
			pattern = pattern.replace(match[0], '');
		}
	}

	/**
	 * @param {Function} handler
	 */
	setHandler(handler) {this.handler = handler;}

	/**
	 * @param {Location} location
	 * @returns {boolean}
	 */
	route(location) {
		let match = this.routePattern.exec(location.pathname);
		if (match !== null) {
			let vars = {};
			for (let i = 1; i < match.length; i++) vars[this.varNames[i - 1]] = match[i];
			this.vars = vars;
			if (this.router) this.router.currentRoute = this;
			if (this.handler) this.handler(vars, location);
			return true;
		} else return false;
	}

	/**
	 * @param {string} name
	 * @returns {Route}
	 */
	as(name) {
		if (this.router) this.router.routes[name] = this;
		this.name = name;
		return this;
	}

	/**
	 * @param {Object<string, string>} args
	 */
	go(args = {}) {
		let path = this.pattern;
		for (let name in args) if (args.hasOwnProperty(name)) {
			path = path.replace('{' + name + '}', args[name]);
		}
		if (this.router) this.router.go(path);
	}

}

let router = new Router();

export {Route, router}