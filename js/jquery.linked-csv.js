(function( $ ) {
	var
		langHeaderRegex = /^(.+)+@(.+)$/,
		datatypeHeaderRegex = /^(.+)\^\^(.+)$/,
		urlHeaderRegex = /^\$(.+)/,
		namespaces = {
			'rel': "http://www.iana.org/assignments/relation/", // IANA Link Relations
			'schema': "http://schema.org/", // schema.org
			'dc': "http://purl.org/dc/terms/", // Dublin Core Metadata Terms
			'dct': "http://purl.org/dc/terms/", // Dublin Core Metadata Terms
			'cc': "http://creativecommons.org/ns#", // Creative Commons Rights Expression Language
			'void': "http://rdfs.org/ns/void#", // VoID
			'wdrs': "http://www.w3.org/2007/05/powder-s#", // POWDER-S
			'rdf': "http://www.w3.org/1999/02/22-rdf-syntax-ns#", // RDF
			'rdfs': "http://www.w3.org/2000/01/rdf-schema#", // RDF Schema
			'owl': "http://www.w3.org/2002/07/owl#", // OWL
			'skos': "http://www.w3.org/2004/02/skos/core#", // SKOS
			'skos-xl': "http://www.w3.org/2008/05/skos-xl#", // SKOS Extensions for Labels			
		},
		prefixRegex = new RegExp('^(' + Object.keys(namespaces).join('|') + '):(.+)$'),

		init = function (linkedCSV, data, base) {
			var
				row = {},
				entity = {},
				prop = '',
				index = 0,
				csv = [],
				properties = [],
				entities = [],
				headers = [],
				rows = [],
				headerIndex = {},
				entityIndex = {},
				propertyIndex = {},
				metadata = {},
				rowMeta = [],
				colMeta = [],
				cellMeta = [],
				parseProp = function(prop, expand) {
					var match;
					if (prefixRegex.test(prop)) {
						if (expand) {
							match = prefixRegex.exec(prop);
							return namespaces[match[1]] + match[2];
						} else {
							return prop;
						}
					} else {
						return $.uri(prop, base).toString();
					}
				},
				parseValue = function(value, type, lang) {
					var val = value;
					if (type === 'url') {
						val = {
							'@id': $.uri.resolve(value, base).toString()
						};
					} else if (type === 'string') {
						val = value;
					} else if (type === 'integer') {
						val = parseInt(value);
					} else if (type in ['decimal', 'double']) {
						val = parseFloat(value);
					} else if (type === 'boolean') {
						val = value === 'true';
					} else if (type === 'time') {
						if (/^\d{4,}$/.test(value)) {
							val = parseInt(value);
						} else if (/^\d{4,}-\d{2}-\d{2}(Z|[+-]\d{2}:\d{2})?$/.test(value)) {
							val = {
								'@value': value,
								'@type': 'http://www.w3.org/2001/XMLSchema#date'
							}
						} else if (/^\d{4,}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) {
							val = {
								'@value': value,
								'@type': 'http://www.w3.org/2001/XMLSchema#dateTime'
							}
						}
					} else if (lang !== undefined) {
						if (value !== '') {
							val = {
								'@value': value,
								'@lang': lang
							}
						}
					} else if (/^\d{4,}$/.test(value)) {
						val = parseInt(value);
					}
					return val;
				},
				parseFragment = function(url) {
					var fragid;
					if (url.substring(0,base.toString().length) === base.toString()) {
						fragid = url.substring(base.toString().length + 1);
						fragid = fragid.split('=');
						fragid[1] = fragid[0] === 'cell' ? fragid[1].split(',') : fragid[1];
						return fragid;
					} else {
						return null;
					}
				};
			csv = $.csv.toObjects(data.replace(/\r([^\n])/g, '\r\n$1'));

			// process the header row
			$.each(csv[0], function(header, value) {
				var match, h = { name: header, '@index': index };
				if (header !== '#') {
					if (header !== '$id' && header !== '') {
						h['@id'] = $.uri.resolve('#' + encodeURIComponent(header), base).toString()
						if (h['@id'] in propertyIndex) {
							propertyIndex[h['@id']].push(h);
						} else {
							propertyIndex[h['@id']] = [h];
						}
					}
					headers.push(h);
					headerIndex[header] = h;
				}
				index++;
				return true;
			});

			// process the remaining rows
			$.each(csv, function(index, row) {
				var
					id = row['$id'] ? $.uri(row['$id'], base) : null,
					entity = id === null ? {} : {'@id': id.toString()},
					r = id === null ? { '@index': index } : {'$id': id.toString(), '@index': index},
					meta = row['#'],
					triple = [],
					label, type, lang, value, prop, fragment;
				if (meta === 'meta') {
					id = id === null ? base : parseProp(id);
					entity = metadata[id] || entity;
					entity['@id'] = id.toString();
					fragment = parseFragment(entity['@id']);
					$.each(row, function(header, value) {
						if (header !== '#' && header !== '$id') {
							triple.push(value);
						}
					});
					if (triple.length === 2) {
						label = triple[0]
						value = triple[1];
					} else {
						if (triple[2] in ['string', 'url', 'integer', 'decimal', 'double', 'boolean', 'time']) {
							label = triple[0];
							value = triple[1];
							type = triple[2];
							prop = triple[3] ? parseProp(triple[3]) : undefined;
						} else if (/^[a-z]{2}$/.test(triple[2])) {
							label = triple[0];
							value = triple[1];
							lang = triple[2];
							prop = triple[3] ? parseProp(triple[3]) : undefined;
						} else if (triple.length === 4) {
							label = triple[0];
							value = triple[1];
							type = parseProp(triple[2], true);
							prop = triple[3] ? parseProp(triple[3]) : undefined;
						} else {
							value = triple[1];
							prop = triple[2] ? parseProp(triple[2]) : undefined;
						}
					}
					if (prop === undefined) {
						prop = parseProp('#' + encodeURIComponent(label));
					}
					if (lang === undefined) {
						value = parseValue(value, type, lang);
						if (prop in entity) {
							if ($.isArray(entity[prop])) {
								entity[prop].push(value);
							} else {
								entity[prop] = [entity[prop], value];
							}
						} else {
							entity[prop] = value;
						}
					} else if (prop in entity && lang in entity[prop]) {
						if ($.isArray(entity[prop][lang])) {
							entity[prop][lang].push(value);
						} else {
							entity[prop][lang] = [entity[prop][lang], value];
						}
					} else if (prop in entity) {
						entity[prop][lang] = value;
					} else {
						entity[prop] = {};
						entity[prop][lang] = value;
					}
					if (!(id in metadata)) {
						metadata[id] = entity;
					}
					if (prop && !(prop in metadata)) {
						metadata[prop] = {
							'@id': prop,
							'rdfs:label': label
						}
					}
					if (fragment) {
						if (fragment[0] === 'row') {
							rowMeta[parseInt(fragment[1])] = entity;
						} else if (fragment[0] === 'col') {
							colMeta[parseInt(fragment[1])] = entity;
						} else if (fragment[0] === 'cell') {
							if (cellMeta[parseInt(fragment[1][0])] === undefined) {
								cellMeta[parseInt(fragment[1][0])] = [];
							}
							cellMeta[parseInt(fragment[1][0])][parseInt(fragment[1][1])] = entity;
						}
					}
				} else {
					$.each(row, function (header, value) {
						var 
							map = headerIndex[header],
							val = value,
							propertyArray = [],
							prop = map !== undefined ? map['@id'] : undefined;
						if (meta === 'url') {
							if (header !== '#' && value !== '') {
								val = parseProp(value, base);
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
							val = parseValue(value, map.type, map.lang);
							if (val !== '') {
								r[header] = val;
								if (map.lang === undefined) {
									if (prop in entity) {
										if ($.isArray(entity[prop])) {
											entity[prop].push(val);
										} else {
											entity[prop] = [entity[prop], val];
										}
									} else {
										entity[prop] = val;
									}
								} else {
									if (prop in entity) {
										if (map.lang in entity[prop]) {
											if ($.isArray(entity[prop][map.lang])) {
												entity[prop][map.lang].push(value);
											} else {
												entity[prop][map.lang] = [entity[prop][map.lang], value];
											}
										} else {
											entity[prop][map.lang] = value;
										}
									} else {
										entity[prop] = {};
										entity[prop][map.lang] = value;
									}
								}
							}
						}
					});
				}
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
								} else if (typeof current === 'object') {
									$.each(entity[prop], function (lang, value) {
										if (lang in entityIndex[id][prop]) {
											if ($.isArray(entityIndex[id][prop][lang])) {
												if ($.isArray(entity[prop][lang])) {
													entityIndex[id][prop][lang] = entityIndex[id][prop][lang].concat(entity[prop][lang]);
												} else {
													entityIndex[id][prop][lang].push(entity[prop][lang]);
												}
											} else if ($.isArray(entity[prop][lang])) {
												entityIndex[id][prop][lang] = [entityIndex[id][prop][lang]];
												entityIndex[id][prop][lang] = entityIndex[id][prop][lang].concat(entity[prop][lang]);
											} else {
												entityIndex[id][prop][lang] = [entityIndex[id][prop][lang], entity[prop][lang]];
											}
										} else {
											entityIndex[id][prop][lang] = entity[prop][lang];
										}
									});
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
				var names = $.map(prop, function (p) { return p.name; });
				properties.push(prop);
				if (!(id in metadata)) {
					metadata[id] = {
						'@id': id,
						'rdfs:label': names.length > 1 ? names : names[0]
					};
				}
			});

			linkedCSV.baseUri = function() {
				return base;
			};
			linkedCSV.headers = function() {
				return $(headers);
			};
			linkedCSV.header = function(id) {
				return headerIndex[id];
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
			linkedCSV.meta = function() {
				return metadata;
			};
			linkedCSV.rowMeta = function () {
				return rowMeta;
			};
			linkedCSV.colMeta = function () {
				return colMeta;
			};
			linkedCSV.cellMeta = function () {
				return cellMeta;
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