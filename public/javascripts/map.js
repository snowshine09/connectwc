var map = new Datamap({
		element: document.getElementById('container'),
		scope:"world"
	});

var basic = new Datamap({
	element: document.getElementById("canvas_map"),
	geographyConfig: {
			// dataUrl: '/usa.json',
			popupTemplate: function(geo, data) {
				var htmlStr = ['<div class="hoverinfo"><strong>' +  data.name + '</strong>',
				'<br/>You have <strong>' +  data.count + '</strong> cohorts here',
				'<br/><i>Click to see the social network of people</i>',
				'</div>'].join('');
				return data && htmlStr; //"<div class='hoverinfo'>There is <strong>" + data.count + "</strong> of your cohorts here</div>"
			}
		},
		fills: {
			HIGH: 'RGB(16,140,181)',
			LOW: 'RGB(194,226,237)',
			MEDIUM: 'RGB(127,215,245)',
            defaultFill: 'RGB(194,226,237)'//,'green'
        },
        scope: 'usa',
        dataUrl: '/locationcount',
        projection: 'mercator',
        done: function(datamap) {
            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                alert(geography.properties.name);
                $.ajax({
                	url: '/students/'+geography.properties.abbr,
                	type: 'get'
                })
                .done(function(students){
                	console.log("success, get total of " + students.length);
                });
            });
        }
    });

