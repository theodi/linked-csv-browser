$(document).ready(function() {
	var
		urlRegex = /(#(.+)|\/([^\/#]+))$/,

	  linkCell = function (id) {
	    return $('<td><a class="btn btn-mini" href="' + id + '"><i class="icon-share"></i></a></td>');
	  },

	  headerValue = function (value, meta) {
	  	var v;
	  	if (value in meta && 'rdfs:label' in meta[value]) {
	  		v = meta[value]['rdfs:label'];
	  		if ($.isArray(v)) v = v[0];
	  		if (typeof v === 'object') v = v['en'];
	  		return v;
	  	} else {
	  		v = urlRegex.exec(value);
	  		return v ? (v[2] || v[3]) : value;
	  	}
	  },

	  tableValue = function (value, includeBadge) {
	    var v = value;
	    if ($.isArray(value)) {
	      v = '<div class="dropdown">';
	      v += '<a class="dropdown-toggle" data-toggle="dropdown" href="#">' + tableValue(value[0], includeBadge) + '</a>';
	      v += '<ul class="dropdown-menu">';
	      $.each(value, function (index, value) {
	        v += '<li><a>' + tableValue(value, includeBadge) + '</a></li>';
	      });
	      v += '</ul>';
	      v += '</div>';
	      return v;
	    } else if (value['@id']) {
	      return '<a class="btn btn-mini" href="' + value['@id'] + '"><i class="icon-share"></i></a>';
	    } else if (value['@value']) {
	      v = value['@value'].replace(/\s+/, '&nbsp;');
	      if (includeBadge) {
	        v += '&nbsp;<span class="badge">' + value['@lang'] + '</span>';
	      }
	      return v;
	    } else {
	      return v.replace(/\s+/, '&nbsp;');
	    }
	  },

	  addRows = function($table, data) {
	    var $body = $table.find('tbody');
	    data.rows().each(function (index) {
	      var 
	        $idCell = linkCell(this['$id']),
	        $row = $('<tr></tr>').append($idCell).appendTo($body);
	      addCells($row, this, data);
	    });
	  },

	  addCells = function($row, row, data) {
	    data.headers().each(function (index) {
	      var value = '&nbsp;', ref;
	      if (this['@id']) {
	        value = row[this.name] || value;
	        if (this.see) {
	          $.each(this.see, function (filename, data) {
	            var entity = data.entity(value['@id']);
	            addPropertyCells($row, entity, data);
	          });
	        } else {
	          $row.append('<td>' + tableValue(value) + '</td>');
	        }
	      }
	    });
	  },

	  addPropertyCells = function($row, entity, data) {
	    $.each(data.properties(), function (i, headers) {
			var value = '&nbsp;';
			value = entity ? entity[headers[0]['@id']] || value : value;
			if ($.isArray(value)) {
				$.each(value, function(k, val) {
					$row.append('<td>' + tableValue(val, false) + '</td>');
				});
			} else {
				$row.append('<td>' + tableValue(value, false) + '</td>');
			}
	    });
	  },

	  addHeaders = function($table, filename, data) {
	    var
	      $filenameRow = $table.find('thead tr.filename'),
	      $propertyHeaderRow = $table.find('thead tr.property'),
	      $annotationHeaderRow = $table.find('thead tr.annotation');
	    data.headers().each(function (index) {
	      var
	        $lastFilename = $filenameRow.find('th:last'),
	        $lastProperty = $propertyHeaderRow.find('th:last'),
	        label = headerValue(this['@id'], data.meta());
	      if (this['@id']) {
	        if (this.see) {
	          $.each(this.see, function (filename, data) {
	            addPropertyHeaders($table, filename, data);
	          });
	        } else {
	          if ($lastFilename.text() === filename) {
	            // increase the colspan
	            $lastFilename.attr('colspan', parseInt($lastFilename.attr('colspan') || 1) + 1);
	          } else {
	            // add a new filename header cell
	            $filenameRow.append('<th colspan="1">' + filename + '</th>');
	          }
	          if (this.lang || this.type) {
	            if ($lastFilename.text() === filename && $lastProperty.text() === label) {
	              $lastProperty.attr('colspan', parseInt($lastProperty.attr('colspan') || 1) + 1);
	            } else {
	              $propertyHeaderRow.append('<th colspan="1">' + label + '</th>');
	            }
	            $annotationHeaderRow.append('<th><span class="badge">' + (this.lang || this.type) + '</span></th>');
	          } else {
	            $propertyHeaderRow.append('<th rowspan="2">' + label + '</th>');
	          }
	        }
	      }
	    });
	    return $table;
	  },

	  addPropertyHeaders = function($table, filename, data) {
	    var
	      $filenameRow = $table.find('thead tr.filename'),
	      $propertyHeaderRow = $table.find('thead tr.property'),
	      $annotationHeaderRow = $table.find('thead tr.annotation');
	    $.each(data.properties(), function (property, details) {
	      var
	        $lastFilename = $filenameRow.find('th:last'),
	        $lastProperty = $propertyHeaderRow.find('th:last'),
	        label = headerValue(details[0]['@id'], data.meta());
	      if ($lastFilename.text() === filename) {
	        // increase the colspan
	        $lastFilename.attr('colspan', parseInt($lastFilename.attr('colspan') || 1) + details.length);
	      } else {
	        // add a new filename header cell
	        $filenameRow.append('<th colspan="' + details.length + '">' + filename + '</th>');
	      }
	      if (details.length === 1) {
		      $propertyHeaderRow.append('<th rowspan="2">' + label + '</th>');
	      } else {
		      $propertyHeaderRow.append('<th colspan="' + details.length + '">' + label + '</th>');
		      $.each(details, function(index, property) {
	            $annotationHeaderRow.append('<th><span class="badge">' + (property.lang || property.type) + '</span></th>');
		      });
	      }
	    });
	    return $table;
	  };

	$.linkedCSV({
	  url: 'tests/european_unemployment1.0/countries.csv', 
	  base: $.uri.base(),
	  success: function(data) {
	    var $table = $('<table class="table table-condensed table-striped table-hover table-bordered"><thead><tr class="filename"><th colspan="1">countries.csv</th></tr><tr class="property"><th rowspan="2"></th></tr><tr class="annotation"></tr></thead><tbody></tbody></table>').appendTo($('#tables'));
	    addHeaders($table, 'countries.csv', data);
	    addRows($table, data);
	    /*
	    $table.dataTable({
	      bLengthChange: false,
	    });
	*/
	  }
	});
})
