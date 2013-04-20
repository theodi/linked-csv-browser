module("linked CSV parsing");

asyncTest("reading from file", function() {
	var data = $.linkedCSV({
		url: 'test1.csv', 
		base: $.uri.base(),
		success: function (data) {
			ok(data, "we read some data from the file");
			equal(data.rows().length, 4, "there should be four rows");
			equal(data.entities().length, 2, "there should be two entities");
			start();
		}
	});
});

test("linked CSV with only x0D line endings column", function() {
	$.linkedCSV({
		data: "$id,country,name\r" +
"#AD,AD,Andorra\r" +
"#AD,AD,Principality of Andorra\r" +
"#AF,AF,Afghanistan\r" +
"#AF,AF,Islamic Republic of Afghanistan", 
		base: 'http://example.org/data/countries',
		success: function (data) {
			ok(data, "we get some data from the CSV");
			equal(data.rows().length, 4, "there should be four rows");
			deepEqual(data.rows().get(0), {
				'@index': 0,
				'$id': 'http://example.org/data/countries#AD',
				'country': 'AD',
				'name': 'Andorra'
			})
			deepEqual(data.properties().get(0), [{
					'@id': 'http://example.org/data/countries#country',
					'@index': 1,
					'name': 'country'
				}], "the properties() method should return information about the properties");
			deepEqual(data.properties().get(1), [{
					'@id': 'http://example.org/data/countries#name',
					'@index': 2,
					'name': 'name'
				}], "the properties() method should return information about the properties");
			equal(data.entities().length, 2, "there should be two entities");
			equal(data.entities().get(0)['@id'], 'http://example.org/data/countries#AD', "should resolve URIs in ids");
			equal(data.entities().get(1)['@id'], 'http://example.org/data/countries#AF', "should collect the two entities");
			equal(data.entities().get(0)['http://example.org/data/countries#country'], 'AD', "should pull out the value of the country property");
			deepEqual(data.entities().get(0)['http://example.org/data/countries#name'], ['Andorra', 'Principality of Andorra'], "should pull out both values of the name property");
		}
	});
});

test("linked CSV with $id column", function() {
	$.linkedCSV({
		data: "$id,country,name\r\n" +
"#AD,AD,Andorra\r\n" +
"#AD,AD,Principality of Andorra\r\n" +
"#AF,AF,Afghanistan\r\n" +
"#AF,AF,Islamic Republic of Afghanistan", 
		base: 'http://example.org/data/countries',
		success: function (data) {
			ok(data, "we get some data from the CSV");
			equal(data.rows().length, 4, "there should be four rows");
			deepEqual(data.rows().get(0), {
				'@index': 0,
				'$id': 'http://example.org/data/countries#AD',
				'country': 'AD',
				'name': 'Andorra'
			})
			deepEqual(data.properties().get(0), [{
					'@id': 'http://example.org/data/countries#country',
					'@index': 1,
					'name': 'country'
				}], "the properties() method should return information about the properties");
			deepEqual(data.properties().get(1), [{
					'@id': 'http://example.org/data/countries#name',
					'@index': 2,
					'name': 'name'
				}], "the properties() method should return information about the properties");
			equal(data.entities().length, 2, "there should be two entities");
			equal(data.entities().get(0)['@id'], 'http://example.org/data/countries#AD', "should resolve URIs in ids");
			equal(data.entities().get(1)['@id'], 'http://example.org/data/countries#AF', "should collect the two entities");
			equal(data.entities().get(0)['http://example.org/data/countries#country'], 'AD', "should pull out the value of the country property");
			deepEqual(data.entities().get(0)['http://example.org/data/countries#name'], ['Andorra', 'Principality of Andorra'], "should pull out both values of the name property");
		}
	});
});

test("linked CSV with datatyped columns", function() {
	$.linkedCSV({
		data: "#,country,year,population\r\n" +
"type,url,time,\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,1960,9616353\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,1961,9799379\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,1962,9989846\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,1963,10188299", 
		base: 'http://example.org/data/af-populations',
		success: function (data) {
			ok(data, "we get some data from the CSV");
			equal(data.rows().length, 4, "there should be four rows");
			deepEqual(data.headers().get(0), {
					'@id': 'http://example.org/data/af-populations#country',
					'@index': 1,
					'name': 'country',
					'type': 'url'
				}, "the first header should be the country header");
			deepEqual(data.headers().get(1), {
					'@id': 'http://example.org/data/af-populations#year',
					'@index': 2,
					'name': 'year',
					'type': 'time'
				}, "the second header should be the year header");
			deepEqual(data.headers().get(2), {
					'@id': 'http://example.org/data/af-populations#population',
					'@index': 3,
					'name': 'population'
				}, "the final header should be the population header");
			deepEqual(data.properties().get(0), [{
					'@id': 'http://example.org/data/af-populations#country',
					'@index': 1,
					'name': 'country',
					'type': 'url'
				}], "the first property should be the country");
			deepEqual(data.properties().get(1), [{
					'@id': 'http://example.org/data/af-populations#year',
					'@index': 2,
					'name': 'year',
					'type': 'time'
				}], "the second property should be the year");
			deepEqual(data.properties().get(2), [{
					'@id': 'http://example.org/data/af-populations#population',
					'@index': 3,
					'name': 'population'
				}], "the third property should be the population");
			equal(data.entities().length, 4, "there should be four entities");
			deepEqual(data.entities().get(0), {
				'http://example.org/data/af-populations#country': { 
					'@id': 'http://en.wikipedia.org/wiki/Afghanistan' 
				},
				'http://example.org/data/af-populations#year': 1960,
				'http://example.org/data/af-populations#population': 9616353
			});
		}
	});
});

test("linked CSV with language columns", function() {
	$.linkedCSV({
		data: "#,$id,country,english name,french name\r\n" +
"lang,,,en,fr\r\n" +
"url,,,#name,#name\r\n" +
",http://en.wikipedia.org/wiki/Andorra,AD,Andorra,Andorre\r\n" +
",http://en.wikipedia.org/wiki/Andorra,,Principality of Andorra,\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,AF,Afghanistan,Afghanistan\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,,Islamic Republic of Afghanistan,", 
		base: 'http://example.org/data/countries',
		success: function (data) {
			ok(data, "we get some data from the CSV");
			equal(data.rows().length, 4, "there should be four rows");
			deepEqual(data.headers().get(0), {
					'@index': 1,
					"name": "$id"
				}, "the first header should be the $id column");
			deepEqual(data.headers().get(1), {
					"@id": "http://example.org/data/countries#country",
					'@index': 2,
					"name": "country"
				}, "the second header should be the country column");
			deepEqual(data.headers().get(2), {
					"@id": "http://example.org/data/countries#name",
					'@index': 3,
					"name": "english name",
					"lang": "en"
				}, "the third header should be the english name column");
			deepEqual(data.headers().get(3), {
					"@id": "http://example.org/data/countries#name",
					'@index': 4,
					"name": "french name",
					"lang": "fr"
				}, "the final header should be the french name column");
			deepEqual(data.properties().get(0), [{
					"@id": "http://example.org/data/countries#country",
					'@index': 2,
					"name": "country"
				}], "the first property should be the country");
			deepEqual(data.properties().get(1), [{
					"@id": "http://example.org/data/countries#name",
					'@index': 3,
					"name": "english name",
					"lang": "en"
				},{
					"@id": "http://example.org/data/countries#name",
					'@index': 4,
					"name": "french name",
					"lang": "fr"
				}], "the second property should be the name");
			equal(data.entities().length, 2, "there should be two entities");
			deepEqual(data.entities().get(0), {
				'@id': 'http://en.wikipedia.org/wiki/Andorra',
				'http://example.org/data/countries#country': 'AD',
				'http://example.org/data/countries#name': {
					'en': [ 'Andorra', 'Principality of Andorra'],
					'fr': 'Andorre'
				}
			}, "it should pull out the three values for the name");
			deepEqual(data.meta(), {
				"http://example.org/data/countries#country": {
					"@id": "http://example.org/data/countries#country",
					"rdfs:label": "country"
				},
				"http://example.org/data/countries#name": {
					"@id": "http://example.org/data/countries#name",
					"rdfs:label": [ "english name", "french name" ]
				}
			}, "the metadata should default to including labels for each of the properties");
		}
	});
});

test("linked CSV with metadata", function() {
	$.linkedCSV({
		data: "#,$id,country,english name,french name,\r\n" +
"lang,,,en,fr,\r\n" +
"url,,,#name,#name,\r\n" +
"meta,#country,label,Country,en,rdfs:label\r\n" +
"meta,#name,label,Name,en,rdfs:label\r\n" +
"meta,,source,source.xml,url,dc:source\r\n" +
"meta,#col=5,note,dummy column,en,rdfs:comment\r\n" +
",http://en.wikipedia.org/wiki/Andorra,AD,Andorra,Andorre,\r\n" +
",http://en.wikipedia.org/wiki/Andorra,,Principality of Andorra,,\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,AF,Afghanistan,Afghanistan,\r\n" +
",http://en.wikipedia.org/wiki/Afghanistan,,Islamic Republic of Afghanistan,,\r\n" +
"meta,#row=6,note,first data row,en,rdfs:comment\r\n" +
"meta,\"#cell=6,1\",note,first data cell,en,rdfs:comment",
		base: 'http://example.org/data/countries',
		success: function (data) {
			ok(data, "we get some data from the CSV");
			equal(data.rows().length, 4, "there should be four rows");
			deepEqual(data.meta(), {
				"http://example.org/data/countries#country": {
					"@id": "http://example.org/data/countries#country",
					"rdfs:label": {
						"en": "Country"
					}
				},
				"http://example.org/data/countries#name": {
					"@id": "http://example.org/data/countries#name",
					"rdfs:label": {
						"en": "Name"
					}
				},
				"rdfs:label": {
					"@id": "http://www.w3.org/2000/01/rdf-schema#label",
					"rdfs:label": "label"
				},
				"http://example.org/data/countries#col=5": {
					"@id": "http://example.org/data/countries#col=5",
					"rdfs:comment": {
						"en": "dummy column"
					}
				},
				"http://example.org/data/countries#row=6": {
					"@id": "http://example.org/data/countries#row=6",
					"rdfs:comment": {
						"en": "first data row"
					}
				},
				"http://example.org/data/countries#cell=6,1": {
					"@id": "http://example.org/data/countries#cell=6,1",
					"rdfs:comment": {
						"en": "first data cell"
					}
				},
				"rdfs:comment": {
					"@id": "http://www.w3.org/2000/01/rdf-schema#comment",
					"rdfs:label": "note"
				},
				"http://example.org/data/countries": {
					"@id": "http://example.org/data/countries",
					"dc:source": {
						"@id": "http://example.org/data/source.xml"
					}
				},
				"dc:source": {
					"@id": "http://purl.org/dc/terms/source",
					"rdfs:label": "source"
				}				
			}, "the metadata should pick up the labels of the properties from the metadata");
			deepEqual(data.colMeta()[5], {
				"@id": "http://example.org/data/countries#col=5",
				"rdfs:comment": {
					"en": "dummy column"
				}
			}, "the metadata about the column should be available");
			deepEqual(data.rowMeta()[6], {
				"@id": "http://example.org/data/countries#row=6",
				"rdfs:comment": {
					"en": "first data row"
				}
			}, "the metadata about the row should be available");
			deepEqual(data.cellMeta()[6][1], {
				"@id": "http://example.org/data/countries#cell=6,1",
				"rdfs:comment": {
					"en": "first data cell"
				}
			}, "the metadata about the cell should be available");
		}
	});
});

asyncTest("linked documents", function() {
	var data = $.linkedCSV({
		url: 'test2.csv', 
		base: $.uri.base(),
		success: function (data) {
			ok(data, "we read some data from the file");
			equal(data.rows().length, 4, "there should be four rows");
			equal(data.entities().length, 4, "there should be four entities");
			equal(data.headers().get(0).see['test3.csv'].headers().length, 4, "there should be four headers in the referenced file");
			start();
		}
	});
});


