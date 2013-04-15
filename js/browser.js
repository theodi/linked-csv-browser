$(document).ready(function() {
	var
		urlRegex = /(#(.+)|\/([^\/#]+))$/,
		fragidRegex = /^#row=(\d+)(-(\d+))?$/,

	  linkCell = function (id) {
	    return id ? $('<td><a href="' + id + '"><i class="icon-share"></i></a></td>') : null;
	  },

	  headerValue = function (value, meta) {
	  	var v;
	  	if (value in meta && 'rdfs:label' in meta[value]) {
	  		v = meta[value]['rdfs:label'];
	  		if ($.isArray(v)) v = v[0];
	  		if (typeof v === 'object') v = v['en'];
	  		return '<a href="' + value + '">' + v + '</a>';
	  	} else {
	  		v = urlRegex.exec(value);
	  		return v ? '<a href="' + value + '">' + (v[2] || v[3]) + '</a>' : value;
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
	      return '<a href="' + value['@id'] + '"><i class="icon-share"></i></a>';
	    } else if (value['@value']) {
	      v = value['@value'].replace(/\s+/, '&nbsp;');
	      if (includeBadge) {
	        v += '&nbsp;<span class="badge">' + value['@lang'] + '</span>';
	      }
	      return v;
	    } else {
	      return v.toString().replace(/\s+/, '&nbsp;');
	    }
	  },

	  addRows = function($table, data, start, end) {
	    var 
	    	$body = $table.find('tbody'),
	    	colspan = 1,
	    	rows = data.rows(),
	    	pager = '';
	    rows.slice(start, end).each(function (index) {
	      var 
	        $idCell = linkCell(this['$id']),
	        $row = $('<tr></tr>').append($idCell).appendTo($body);
	      addCells($row, this, data);
	    });
	    if (start > 0 || end < rows.length) {
		    pager = '<ul class="pager">';
		    if (start === 0) {
		    	pager += '<li class="previous disabled"><a href="#row=' + start + '-' + end + '">Previous</a></li>';
		    } else {
		    	pager +=
	    			'<li class="previous">' +
	    				'<a href="#row=' + (start - 50) + '-' + start + '">Previous</a>' +
	    			'</li>';
		    }
		    if (end >= rows.length) {
		    	pager += '<li class="next disabled"><a href="#row=' + start + '-' + end + '">Next</a></li>';
		    } else {
		    	pager +=
	    			'<li class="next">' + 
	    				'<a href="#row=' + end + '-' + (end + 50) + '">Next</a>' + 
	    			'</li>';
		    }
		    pager += '</ul>';
		    $table.after('<div class="container">' + pager + '</div>');
	    }
	  },

	  addCells = function($row, row, data) {
	    data.headers().each(function (index) {
	      var value = '&nbsp;', ref;
	      if (this['@id']) {
	        value = row[this.name] || value;
	        $row.append('<td>' + tableValue(value) + '</td>');
	        if (this.see) {
	          $.each(this.see, function (filename, data) {
	            var entity = data.entity(value['@id']);
	            addPropertyCells($row, entity, data);
	          });
	        }
	      }
	    });
	  },

	  addPropertyCells = function($row, entity, data) {
	  	var html = '';
	  	if ('@html' in entity) {
				html = entity['@html'];	 
				$row.append(html);
	  	} else {
		    $.each(data.properties(), function (i, headers) {
					var value = '&nbsp;', cell;
					value = entity ? entity[headers[0]['@id']] || value : value;
					if ($.isArray(value)) {
						$.each(value, function(k, val) {
							var cell = '<td>' + tableValue(val, false) + '</td>';
							html += cell;
							$row.append(cell);
			        if (headers[k].see) {
			          $.each(headers[k].see, function (filename, data) {
			            var entity = data.entity(value['@id']);
			            html += addPropertyCells($row, entity, data);
			          });
			        }
						});
					} else if (typeof value === 'object' && !('@id' in value)) {
						$.each(headers, function (j, header) {
							var cell = '<td>' + value[header.lang] + '</td>';
							html += cell;
							$row.append(cell);
						});
					} else {
						cell = '<td>' + tableValue(value, false) + '</td>';
						html += cell;
						$row.append(cell);
		        if (headers[0].see) {
		          $.each(headers[0].see, function (filename, data) {
		            var entity = data.entity(value['@id']);
		            html += addPropertyCells($row, entity, data);
		          });
		        }
					}
		    });
		    entity['@html'] = html;
	  	}
			return html;
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
          if ($lastFilename.text() === filename) {
            // increase the colspan
            $lastFilename.attr('colspan', parseInt($lastFilename.attr('colspan') || 1) + 1);
          } else {
            // add a new filename header cell
            $filenameRow.append('<th colspan="1">' + filename + '</th>');
          }
          if (this.lang || this.type) {
            if ($lastFilename.text() === filename && $lastProperty.html() === label) {
              $lastProperty.attr('colspan', parseInt($lastProperty.attr('colspan') || 1) + 1);
            } else {
              $propertyHeaderRow.append('<th colspan="1">' + label + '</th>');
            }
            $annotationHeaderRow.append('<th><span class="badge">' + (this.lang || this.type) + '</span></th>');
          } else {
            $propertyHeaderRow.append('<th rowspan="2">' + label + '</th>');
          }
	        if (this.see) {
	          $.each(this.see, function (filename, data) {
	            addPropertyHeaders($table, filename, data);
	          });
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
	        if (details[0].see) {
	          $.each(details[0].see, function (filename, data) {
	            addPropertyHeaders($table, filename, data);
	          });
	        }
	      } else {
		      $propertyHeaderRow.append('<th colspan="' + details.length + '">' + label + '</th>');
		      $.each(details, function(index, property) {
	            $annotationHeaderRow.append('<th><span class="badge">' + (property.lang || property.type) + '</span></th>');
			        if (property.see) {
			          $.each(property.see, function (filename, data) {
			            addPropertyHeaders($table, filename, data);
			          });
			        }
		      });
	      }
	    });
	    return $table;
	  },
	  query = document.location.search,
	  url = /^\?url=/.test(query) ? decodeURIComponent(query.substring(5)) : null,
	  filename;

  if (url) {
  	filename = urlRegex.exec(url)[3];
  	$('#load-url').val(url);
  	$.linkedCSV({
			  url: url, 
			  base: $.uri.base(),
			  success: function(data) {
			    var 
			    	fragment = document.location.hash;
			    	filename = filename,
			    	$table = $('<table class="table table-condensed table-striped table-hover table-bordered"><thead><tr class="filename"></tr><tr class="property"></tr><tr class="annotation"></tr></thead><tbody></tbody></table>').appendTo($('#tables')),
			    	$filenameRow = $table.find('tr.filename'),
			    	$propertyRow = $table.find('tr.property'),
			    	match = [];
			    if (data.header('$id')) {
			    	$filenameRow.append('<th colspan="1">' + filename + '</th>');
			    	$propertyRow.append('<th rowspan="2"></th>');
			    }
			    addHeaders($table, filename, data);
			    if (fragidRegex.test(fragment)) {
			    	match = fragidRegex.exec(fragment);
				    addRows($table, data, parseInt(match[1]), parseInt(match[3] !== '' ? match[3] : match[1]));
			    } else {
			    	document.location.hash = '#row=0-50';
			    	addRows($table, data, 0, 50);
			    }
			    window.onhashchange = function (event) {
			    	var match = fragidRegex.exec(document.location.hash);
			    	if (match) {
				    	$table.find('tbody').html('');
				    	addRows($table, data, parseInt(match[1]), parseInt(match[3] !== '' ? match[3] : match[1]));
			    	}
			    };
			  }
			});
		}
})
