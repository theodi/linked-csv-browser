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
				'$id': 'http://example.org/data/countries#AD',
				'country': 'AD',
				'name': 'Andorra'
			})
			deepEqual(data.properties().get(0), [{
					header: 'country',
					property: 'country'
				}], "the properties() method should return information about the properties");
			deepEqual(data.properties().get(1), [{
					header: 'name',
					property: 'name'
				}], "the properties() method should return information about the properties");
			equal(data.entities().length, 2, "there should be two entities");
			equal(data.entities().get(0)['@id'], 'http://example.org/data/countries#AD', "should resolve URIs in ids");
			equal(data.entities().get(1)['@id'], 'http://example.org/data/countries#AF', "should collect the two entities");
			equal(data.entities().get(0)['country'], 'AD', "should pull out the value of the country property");
			deepEqual(data.entities().get(0)['name'], ['Andorra', 'Principality of Andorra'], "should pull out both values of the name property");
		}
	});
});

test("linked CSV with datatyped columns", function() {
	$.linkedCSV({
		data: "$country,year^^time,population\r\n" +
"http://en.wikipedia.org/wiki/Afghanistan,1960,9616353\r\n" +
"http://en.wikipedia.org/wiki/Afghanistan,1961,9799379\r\n" +
"http://en.wikipedia.org/wiki/Afghanistan,1962,9989846\r\n" +
"http://en.wikipedia.org/wiki/Afghanistan,1963,10188299", 
		base: 'http://example.org/data/af-populations',
		success: function (data) {
			ok(data, "we get some data from the CSV");
			equal(data.rows().length, 4, "there should be four rows");
			deepEqual(data.headers().get(0), {
					'header': '$country',
					'property': 'country',
					'type': 'url'
				}, "the first header should be the $country header");
			deepEqual(data.headers().get(1), {
					'header': 'year^^time',
					'property': 'year',
					'type': 'time'
				}, "the second header should be the year^^time header");
			deepEqual(data.headers().get(2), {
					'header': 'population',
					'property': 'population'
				}, "the final header should be the population header");
			deepEqual(data.properties().get(0), [{
					'header': '$country',
					'property': 'country',
					'type': 'url'
				}], "the first property should be the country");
			deepEqual(data.properties().get(1), [{
					'header': 'year^^time',
					'property': 'year',
					'type': 'time'
				}], "the second property should be the year");
			deepEqual(data.properties().get(2), [{
					'header': 'population',
					'property': 'population'
				}], "the third property should be the population");
			equal(data.entities().length, 4, "there should be four entities");
			deepEqual(data.entities().get(0), {
				'country': { '@id': 'http://en.wikipedia.org/wiki/Afghanistan' },
				'year': 1960,
				'population': 9616353
			});
		}
	});
});


test("linked CSV with language columns", function() {
	$.linkedCSV({
		data: "$id,country,name@en,name@fr\r\n" +
"http://en.wikipedia.org/wiki/Andorra,AD,Andorra,Andorre\r\n" +
"http://en.wikipedia.org/wiki/Andorra,,Principality of Andorra,\r\n" +
"http://en.wikipedia.org/wiki/Afghanistan,AF,Afghanistan,Afghanistan\r\n" +
"http://en.wikipedia.org/wiki/Afghanistan,,Islamic Republic of Afghanistan,", 
		base: 'http://example.org/data/countries',
		success: function (data) {
			ok(data, "we get some data from the CSV");
			equal(data.rows().length, 4, "there should be four rows");
			deepEqual(data.headers().get(0), {
					"header": "$id"
				}, "the first header should be the $id column");
			deepEqual(data.headers().get(1), {
					"header": "country",
					"property": "country"
				}, "the second header should be the country column");
			deepEqual(data.headers().get(2), {
					"header": "name@en",
					"property": "name",
					"lang": "en"
				}, "the third header should be the name@en column");
			deepEqual(data.headers().get(3), {
					"header": "name@fr",
					"property": "name",
					"lang": "fr"
				}, "the final header should be the name@fr column");
			deepEqual(data.properties().get(0), [{
					"header": "country",
					"property": "country"
				}], "the first property should be the country");
			deepEqual(data.properties().get(1), [{
					"header": "name@en",
					"property": "name",
					"lang": "en"
				},{
					"header": "name@fr",
					"property": "name",
					"lang": "fr"
				}], "the second property should be the name");
			equal(data.entities().length, 2, "there should be two entities");
			deepEqual(data.entities().get(0), {
				'@id': 'http://en.wikipedia.org/wiki/Andorra',
				'country': 'AD',
				'name': [{
					'@lang': 'en',
					'@value': 'Andorra'
				}, {
					'@lang': 'fr',
					'@value': 'Andorre'
				}, {
					'@lang': 'en',
					'@value': 'Principality of Andorra'
				}]
			}, "it should pull out the three values for the name");
		}
	});
});

asyncTest("linked documents", function() {
	var data = $.linkedCSV({
		url: 'test2.csv', 
		base: $.uri.base(),
		success: function (data) {
			ok(data, "we read some data from the file");
			equal(data.rows().length, 5, "there should be five rows");
			equal(data.entities().length, 4, "there should be four entities");
			deepEqual(data.headers().get(1).see['test3.csv'].headers().toArray(), [{
				header: '$id'
			}, {
				header: 'country',
				property: 'country'
			}, {
				header: 'name@en',
				property: 'name',
				lang: 'en'
			}, {
				header: 'name@fr',
				property: 'name',
				lang: 'fr'
			}], "the header info should include references to other files")
			start();
		}
	});
});


