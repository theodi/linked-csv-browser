(function( $ ) {
	var
		langHeaderRegex = /^(.+)+@(.+)$/,
		datatypeHeaderRegex = /^(.+)\^\^(.+)$/,
		urlHeaderRegex = /^\$(.+)/,

		init = function (linkedCSV, data, base) {
			var
				row = {},
				entity = {},
				prop = '',
				csv = [],
				properties = [],
				entities = [],
				headers = [],
				rows = [],
				headerIndex = {},
				entityIndex = {},
				propertyIndex = {},
				firstDataRow = 0,
				toLoad = 0,
				loaded = 0;
			csv = $.csv.toObjects(data);

			// process the header row
			$.each(csv[0], function(header, value) {
				var match, h = { name: header }, propertyArray = [];
				if (header !== '#') {
					if (header !== '$id') {
						h['@id'] = $.uri.resolve('#' + header, base).toString()
					}
					headers.push(h);
					headerIndex[header] = h;
					if (header !== '$id') {
						if (propertyIndex[h['@id']] === undefined) {
							propertyArray.push(h);
							propertyIndex[h['@id']] = propertyArray;
						} else {
							propertyArray = propertyIndex[h['@id']];
							propertyArray.push(h);						
						}
					}
				}
				return true;
			});

			$.each(csv, function(index, row) {
				var
					id = row['$id'] ? $.uri(row['$id'], base) : null,
					entity = id === null ? {} : {'@id': id.toString()},
					r = id === null ? {} : {'$id': id.toString()},
					meta = row['#'];
				$.each(row, function (header, value) {
					var 
						map = headerIndex[header],
						val = value,
						propertyArray = [],
						prop = map !== undefined ? map['@id'] : undefined;
					if (meta === 'url') {
						if (header !== '#' && value !== '') {
							val = $.uri.resolve(value, base).toString();
							if (val !== prop) {
								map['@id'] = val;
								if (propertyIndex[val] === undefined) {
									propertyArray.push(map);
									propertyIndex[val] = propertyArray;
								} else {
									propertyArray = propertyIndex[val];
									propertyArray.push(map);						
								}
								// remove the old version
								propertyArray = [];
								$.each(propertyIndex[prop], function(index, property) {
									if (property['@id'] !== val) {
										propertyArray.push(property);
									}
								});
								if (propertyArray.length === 0) {
									delete propertyIndex[prop];
								}
							}
						}
					} else if (meta === 'type' || meta === 'lang') {
						if (header !== '#' && value !== '') {
							map[meta] = value;
						}
					} else if (meta === 'see') {
						if (header !== '#' && value !== '') {
							val = $.uri.resolve(value, base).toString();
							if (map.see === undefined) map.see = {};
							if (map.see[value] === undefined) {
								// not supplying a success function ensures this is synchronous
								map.see[value] = $.linkedCSV({
									url: val,
									base: val
								});
							}
						}
					} else if (header !== '$id' && header !== '#') {
						if (map.type === 'url') {
							val = {
								'@id': $.uri.resolve(value, base).toString()
							};
						} else if (map.type === 'string') {
							val = value;
						} else if (map.type === 'integer') {
							val = parseInt(value);
						} else if (map.type === 'decimal' || map.type === 'double') {
							val = parseFloat(value);
						} else if (map.type === 'boolean') {
							val = value === 'true';
						} else if (map.type === 'time') {
							if (/^\d{4,}$/.test(value)) {
								val = parseInt(value);
							}
						} else if (map.lang !== undefined) {
							if (value !== '') {
								val = {
									'@value': value,
									'@lang': map.lang
								}
							}
						} else if (/^\d{4,}$/.test(value)) {
							val = parseInt(value);
						}
						if (val !== '') {
							r[header] = val;
							if (entity[prop]) {
								if ($.isArray(entity[prop])) {
									entity[prop].push(val);
								} else {
									entity[prop] = [entity[prop], val];
								}
							} else {
								entity[prop] = val;
							}
						}
					}
				});
				if (row['#'] && row['#'] !== '') {
					// row doesn't contain any entities
				} else {
					if (id === null || entityIndex[id] === undefined) {
						// add the new entity to the entity index
						entities.push(entity);
						if (id !== null) entityIndex[id] = entity;
					} else {
						// update the existing entity with the additional information
						$.each(entity, function (prop, value) {
							if (prop !== '@id') {
								var current = entityIndex[id][prop];
								if ($.isArray(current)) {
									if ($.isArray(entity[prop])) {
										entityIndex[id][prop] = current.concat(entity[prop]);
									} else {
										entityIndex[id][prop].push(entity[prop]);
									}
								} else if (current !== entity[prop]) {
									entityIndex[id][prop] = [current, entity[prop]];
								}
							}
						});
					}
					rows.push(r);
				}
			});

			// create the array of properties from the propertyIndex
			$.each(propertyIndex, function(id, prop) {
				properties.push(prop);
			});

			linkedCSV.headers = function() {
				return $(headers);
			};
			linkedCSV.rows = function() {
				return $(rows);
			};
			linkedCSV.properties = function() {
				return $(properties);
			};
			linkedCSV.entities = function() {
				return $(entities);
			};
			linkedCSV.entity = function(id) {
				return entityIndex[id];
			};
			return linkedCSV;
		};

	$.linkedCSV = function (options) {
		return new $.linkedCSV.fn.init(options);
	};

	$.linkedCSV.fn = $.linkedCSV.prototype = {
		linkedCSV: '0.1.0',

		init: function (options) {
			var
				url = options.url,
				base = options.base || $.uri.base(),
				data = options.data,
				success = options.success,
				linkedCSV = this;

			if (data === undefined) {
				// get the data from the url provided
				if (url === undefined) {
					throw "Identify some CSV data through the data option or the url option";
				} else {
					url = $.uri.resolve(url, base);
					if (success === undefined) {
						$.ajax({
							url: url.toString(),
							dataType: 'text',
							async: false
						}).done(function (data) {
							init(linkedCSV, data, url);
						});
					} else {
						$.get(url, function(data) {
							init(linkedCSV, data, url);
							success(linkedCSV);
						}, 'text');
					}
				}
			} else {
				init(linkedCSV, data, base);
				success(linkedCSV);
			}
			return linkedCSV;
		}
	};

	$.linkedCSV.fn.init.prototype = $.linkedCSV.fn;
})( jQuery );