$(document).ready(function() {
	var
		urlRegex = /(#(.+)|\/([^\/#]+))$/,
		fragidRegex = /^#row=(\d+)(-(\d+))?$/,

		extractMetadata = function (metadata, fields) {
			var value;
			for (i in fields) {
				if (fields[i] in metadata) {
					value = metadata[fields[i]];
					delete metadata[fields[i]];
					return value;
				}
			}
		},

		escapeHtml = function (html) {
			return html.replace(/&/g, '&amp;').replace(/\</g, '&lt;').replace(/"/g, '&quot;');
		},

	  linkCell = function (id) {
	    return id ? $('<td><a href="' + id + '"><i class="icon-share"></i></a></td>') : null;
	  },

	  headerLabel = function (value, meta) {
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

	  headerValue = function (value, meta) {
	  	return '<a href="' + (value in meta ? meta[value]['@id'] : value) + '">' + headerLabel(value, meta) + '</a>';
	  },

	  metadataValue = function (value, includeBadge, data) {
	  	if (value['@id']) {
	  		if (value['@id'] in data.meta()) {
	  			return formatMetadata(data.meta()[value['@id']], data);
	  		} else {
		  		return '<a href="' + value['@id'] + '">' + value['@id'] + '</a>';
	  		}
	  	} else {
	  		return tableValue(value, includeBadge);
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
	        v += '&nbsp;<span class="badge">' + (value['@lang'] || /^http:/.test(value['@type']) ? urlRegex.exec(value['@type'])[2] || urlRegex.exec(value['@type'])[3] : value['@type']) + '</span>';
	      }
	      return v;
	    } else if (typeof value === 'object') {
	    	v = '<ul class="unstyled">';
	    	for (lang in value) {
	    		v += '<li>' + ($.isArray(value[lang]) ? value[lang].join(', ') : value[lang]) + ' <span class="badge">' + lang + '</span></li>';
	    	}
	    	v += '</ul>';
	    	return v;
	    } else {
	      return v.toString().replace(/\s+/, '&nbsp;');
	    }
	  },

	  formatMetadata = function(metadata, data) {
	  	var formatted = '';
	  	formatted += '<p class="pull-right">' + tableValue(metadata, false) + '</p>';
	  	if ('schema:streetAddress' in metadata) {
	  		formatted += '<address>';
	  		if ('schema:contactType' in metadata) {
		  		formatted += '<strong>' + metadata['schema:contactType'] + ':</strong><br />';
	  		}
	  		if ('schema:postOfficeBoxNumber' in metadata) {
		  		formatted += metadata['schema:postOfficeBoxNumber'] + '<br />';
	  		}
	  		formatted += metadata['schema:streetAddress'] + '<br />';
	  		if ('schema:addressLocality' in metadata) {
		  		formatted += metadata['schema:addressLocality'] + '<br />';
	  		}
	  		if ('schema:addressRegion' in metadata) {
		  		formatted += metadata['schema:addressRegion'] + '<br />';
	  		}
	  		if ('schema:postalCode' in metadata) {
		  		formatted += metadata['schema:postalCode'] + '<br />';
	  		}
	  		if ('schema:addressCountry' in metadata) {
		  		formatted += metadata['schema:addressCountry'] + '<br />';
	  		}
	  		if ('schema:email' in metadata) {
		  		formatted += '<strong>Email:</strong> ' + metadata['schema:email'] + '<br />';
	  		}
	  		if ('schema:telephone' in metadata) {
		  		formatted += '<strong>Tel:</strong> ' + metadata['schema:telephone'] + '<br />';
	  		}
	  		if ('schema:faxNumber' in metadata) {
		  		formatted += '<strong>Fax:</strong> ' + metadata['schema:faxNumber'] + '<br />';
	  		}
	  		formatted += '</address>';
	  	} else {
		  	formatted += '<dl>';
		  	for (prop in metadata) {
		  		if (prop !== '@id') {
			  		formatted += '<dt>' + headerValue(prop, data.meta()) + '</dt>';
			  		formatted += '<dd>' + metadataValue(metadata[prop], true, data) + '</dd>';
		  		}
		  	}
		  	formatted += '</dl>';
	  	}
	  	return formatted;
	  },

	  addRows = function($table, data, start, end) {
	    var 
	    	$body = $table.find('tbody'),
	    	$pager = $table.parent().find('.pager'),
	    	pager = '',
	    	colspan = 1,
	    	rows = data.rows(),
	    	rowMeta = data.rowMeta();
	    rows.slice(start, end).each(function (index) {
	      var 
	        idCell = linkCell(this['$id']) || (data.header('$id') ? '<td>&nbsp;</td>' : ''),
	        metadataCell = rowMeta.length > 0 ? '<td' + (rowMeta[this['@index']] ? ' class="metadata"><i class="icon icon-pencil" data-content="' + escapeHtml(formatMetadata(rowMeta[this['@index']], data)) + '" data-placement="right"></i>' : '>&nbsp;') + '</td>' : '',
	        $row = $('<tr></tr>').append(metadataCell).append(idCell).appendTo($body);
	      addCells($row, this, data);
	    });
	    if (start > 0 || end < rows.length) {
	    	if (start <= 0) {
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
		    $pager.html(pager);
	    } else {
	    	$pager.html('');
	    }
	  },

	  addCells = function($row, row, data) {
	  	var metaForRow = data.cellMeta()[row['@index']];
	    data.headers().each(function (index) {
	      var 
	      	metadata = metaForRow ? metaForRow[this['@index']] : null,
	      	value = '&nbsp;', 
	      	ref;
	      if (this['@id']) {
	        value = row[this.name] || value;
	        metadata = metadata ? '<i class="pull-right annotation icon icon-pencil" data-content="' + escapeHtml(formatMetadata(metadata, data)) + '" data-placement="left"></i>' : '';
	        $row.append('<td>' + metadata + tableValue(value) + '</td>');
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
	  	if (typeof entity === 'object' && '@html' in entity) {
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
				if (typeof entity === 'object') {
			    entity['@html'] = html;
				}
	  	}
			return html;
	  },

	  addHeaders = function($table, filename, data) {
	    var
	      $filenameRow = $table.find('thead tr.filename'),
	      $propertyHeaderRow = $table.find('thead tr.property'),
	      $annotationHeaderRow = $table.find('thead tr.annotation'),
	      $metadataHeaderRow = $table.find('thead tr.metadata');
	    data.headers().each(function (index) {
	      var
	        $lastFilename = $filenameRow.find('th:last span.filename'),
	        $lastProperty = $propertyHeaderRow.find('th:last'),
	        label = headerValue(this['@id'], data.meta()),
	        metadata = data.colMeta()[this['@index']];
	      if (this['@id']) {
          if ($lastFilename.text() === filename) {
            // increase the colspan
            $lastFilename.parent().attr('colspan', parseInt($lastFilename.parent().attr('colspan') || 1) + 1);
          } else {
            // add a new filename header cell
            $filenameRow.append('<th colspan="1">' +
            		'<span class="filename">' + filename + '</span>' +
            		' <a class="pull-right" href="' + data.baseUri() + '"><i class="icon icon-download-alt"></i></a>' +
            	'</th>');
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
          if (metadata) {
          	$metadataHeaderRow.append('<td class="metadata"><i class="pull-right icon icon-pencil" data-content="' + escapeHtml(formatMetadata(metadata, data)) + '" data-placement="' + (this['@index'] === 0 ? 'right' : 'left') + '"></i></td>');
          } else {
          	$metadataHeaderRow.append('<td>&nbsp;</td>');
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
	      $annotationHeaderRow = $table.find('thead tr.annotation'),
	      $metadataHeaderRow = $table.find('thead tr.metadata'),
	      metadata = data.colMeta();
	    $.each(data.properties(), function (property, details) {
	      var
	        $lastFilename = $filenameRow.find('th:last span.filename'),
	        $lastProperty = $propertyHeaderRow.find('th:last'),
	        label = headerValue(details[0]['@id'], data.meta());
	      if ($lastFilename.text() === filename) {
	        // increase the colspan
	        $lastFilename.parent().attr('colspan', parseInt($lastFilename.parent().attr('colspan') || 1) + details.length);
	      } else {
	        // add a new filename header cell
          $filenameRow.append('<th colspan="' + details.length + '">' +
          		'<span class="filename">' + filename + '</span>' +
          		' <a class="pull-right" href="' + data.baseUri() + '"><i class="icon icon-download-alt"></i></a>' +
          	'</th>');
	      }
	      if (details.length === 1) {
		      $propertyHeaderRow.append('<th rowspan="2">' + label + '</th>');
		      $metadataHeaderRow.append('<td class="metadata">' + (metadata[details[0]['@index']] ? '<i class="icon icon-pencil" data-content="' + escapeHtml(formatMetadata(metadata[details[0]['@index']], data)) + '" data-placement="bottom"></i>' : '&nbsp;') + '</td>');
	        if (details[0].see) {
	          $.each(details[0].see, function (filename, data) {
	            addPropertyHeaders($table, filename, data);
	          });
	        }
	      } else {
		      $propertyHeaderRow.append('<th colspan="' + details.length + '">' + label + '</th>');
		      $.each(details, function(index, property) {
	            $annotationHeaderRow.append('<th><span class="badge">' + (property.lang || property.type) + '</span></th>');
				      $metadataHeaderRow.append('<td>' + (metadata[property['@index']] ? '<i class="icon icon-pencil" data-content="' + escapeHtml(formatMetadata(metadata[property['@index']], data)) + '" data-placement="bottom"></i>' : '&nbsp;') + '</td>');
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

	  addMetadata = function ($metadata, filename, data) {
	  	var
	  		$tabs = $metadata.find('ul.nav-tabs'),
	  		$content = $metadata.find('div.tab-content'),
	  		i = $tabs.find('li').length,
	  		metadata = $.extend({}, data.meta()[data.baseUri()] || {}),
	  		title = extractMetadata(metadata, ['dct:title', 'dc:title', 'rdfs:label']),
	  		desc = extractMetadata(metadata, ['dct:description', 'dc:description', 'rdfs:comment']);
	  	title = typeof title === 'object' ? title['en'] : title;
	  	desc = typeof desc === 'object' ? desc['en'] : desc;
	  	$tabs.append('<li' + (i === 0 ? ' class="active"' : '') + '><a href="#file' + i + '" data-toggle="tab">' + filename + '</a></li>');
	  	$content.append('<div id="file' + i + '" class="tab-pane' + (i === 0 ? ' active' : '') + '">' +
	  			'<div class="page-header">' +
	  				'<h2>' + (title ? title + ' <small>' + filename + '</small>' : filename) + '</h2>' +
	  			'</div>' +
	  			'<div class="row-fluid">' +
	  				'<div class="span7">' +
	  					(desc ? '<p>' + desc + '</p>' : '') +
	  					formatMetadata(metadata, data) +
	  				'</div>' +
	  				'<div class="span5">' +
	  					'<div class="well">' +
	  						'<h3>Statistics</h3>' +
  							'<div class="row-fluid">' +
  								'<p class="span6">' +
  									'<span class="badge">' + data.rows().length + '</span> rows' +
  								'</p>' + 
  								'<p class="span6">' +
  									'<span class="badge">' + data.entities().length + '</span> entities' +
  								'</p>' + 
  							'</div>' +
  							'<div class="row-fluid">' +
  								'<div class="span6">' +
  									'<h4>Headers</h4>' +
			  						'<ol class="unstyled">' +
			  							data.headers().map(function (index) {
			  								if (this.name !== '') {
				  								return '<li><code>' + this.name + '</code>' + ((this.lang || this.type) ? (' <span class="badge">' + (this.lang || this.type) + '</span>') : '') + '</li>';
			  								}
			  							}).get().join('') +
			  						'</ol>' +
			  					'</div>' +
  								'<div class="span6">' +
  									'<h4>Properties</h4>' +
			  						'<ol class="unstyled">' +
			  							data.properties().map(function (index) {
			  								var annotations = [];
			  								$.each(this, function(i, header) {
			  									if (header.lang && !(header.lang in annotations)) {
			  										annotations.push(header.lang);
			  									} else if (header.type && !(header.type in annotations)) {
			  										annotations.push(header.type);
			  									}
			  								});
			  								return '<li>' + headerValue(this[0]['@id'], data.meta()) + (annotations.length > 0 ? $.map(annotations, function (annotation) { return ' <span class="badge">' + annotation + '</span>'; }).join('') : '') + '</li>';
			  							}).get().join('') +
			  						'</ol>' +
			  					'</div>' +
		  					'</div>' +
	  					'</div>' +
	  				'</div>' +
	  			'</div>' +
	  		'</div>');
	    data.headers().each(function (index) {
        if (this.see) {
          $.each(this.see, function (filename, data) {
          	if (data.headers !== undefined) {
	            addMetadata($metadata, filename, data);
          	}
          });
        }
	    });
	  },

	  query = document.location.search,
	  url = /^\?url=/.test(query) ? decodeURIComponent(query.substring(5)) : null,
	  filename;

  if (url) {
  	filename = urlRegex.exec(url)[3];
  	$('#load-url').val(url);
  	$.linkedCSV({
			  url: url, 
			  base: url,

			  success: function(data) {
			    var 
			    	fragment = document.location.hash;
			    	filename = filename,
			    	colMeta = data.colMeta(),
			    	rowMeta = data.rowMeta(),
			    	$table = $('<table class="table table-condensed table-striped table-hover table-bordered"><thead><tr class="filename"></tr><tr class="property"></tr><tr class="annotation"></tr>' + (colMeta.length > 0 ? '<tr class="metadata"></tr>' : '') + '</thead><tbody></tbody></table>').appendTo($('#tables')),
			    	$pager = $('<div class="container"><ul class="pager"></ul></div>').appendTo($('#tables')),
			    	$filenameRow = $table.find('tr.filename'),
			    	$propertyRow = $table.find('tr.property'),
			    	match = [];
			    $('#status').hide();
			    if (data.header('$id')) {
			    	$filenameRow.append('<th colspan="' + (rowMeta.length > 0 ? '2' : '1') + '"><span class="filename">' + filename + '</span> <a class="pull-right" href="' + url + '"><i class="icon icon-download-alt"></i></a></th>');
			    	$propertyRow.append('<th rowspan="' + (colMeta.length > 0 ? '3' : '2') + '"' + (rowMeta.length > 0 ? ' colspan="2"' : '') + '></th>');
			    } else if (rowMeta.length > 0) {
			    	$filenameRow.append('<th colspan="1"><span class="filename">' + filename + '</span> <a class="pull-right" href="' + url + '"><i class="icon icon-download-alt"></i></a></th>');
			    	$propertyRow.append('<th rowspan="' + (colMeta.length > 0 ? '3' : '2') + '"></th>');
			    }
			    addMetadata($('#metadata'), filename, data);
			    addHeaders($table, filename, data);
			    if (fragment.substring(0,6) === '#meta=') {
			    	$('.nav-pills a[href=#metadata]').tab('show');
			    }
			    if (fragidRegex.test(fragment)) {
			    	match = fragidRegex.exec(fragment);
				    addRows($table, data, parseInt(match[1]), parseInt(match[3] !== '' ? match[3] : match[1]));
			    } else {
			    	document.location.hash = '#row=0-50';
			    	addRows($table, data, 0, 50);
			    }
			    window.onhashchange = function (event) {
			    	var 
			    		fragid = document.location.hash,
			    		match = fragidRegex.exec(fragid);
			    	if (fragid.substring(0,6) === '#meta=') {
			    		$('.nav-pills a[href=#metadata]').tab('show');
			    	} else if (match) {
				    	$table.find('tbody').html('');
				    	addRows($table, data, parseInt(match[1]), parseInt(match[3] !== '' ? match[3] : match[1]));
			    	}
						$('i.annotation').popover({ title: 'Notes', html: true, trigger: 'hover' });
			    };
					$('td.metadata i, i.annotation').popover({ title: 'Notes', html: true, trigger: 'hover' });
			  },

			  failure: function (error) {
			  	$('#progress').hide();
			  	$('#load-error').show();
			  },

			  progress: function (filename, state) {
			  	var 
			  		file = 	urlRegex.exec(filename)[3],
			  		$dd = $('#progress dt:contains(' + file + ')').next('dd:first');
			  	if ($dd.length >= 1) {
			  		if (state === 'error') {
			  			$dd
			  				.addClass('text-error')
			  				.text('not found');
			  		} else if (state === 'complete') {
				  		$dd
				  			.addClass('text-success')
				  			.text('loaded');
			  		} else {
			  			$dd.text(state + '...');
			  		}
			  	} else {
			  		$('#progress').append(
			  			'<dt>' + file + '</dt>' +
			  			'<dd>' + state + '...</dd>'
			  		)
			  	}
			  }

			});

		}
})
