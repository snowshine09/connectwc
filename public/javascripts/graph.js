//dropdown for choose types of visualized hub
$('.connectedby').dropdown('set selected','classes')
.dropdown({onChange: function(value, text, $selectedItem){
  var filter = localStorage.getItem('filterBy')?JSON.parse(localStorage.getItem('filterBy'))['state']:null;
  update(value, filter);
}});

$(document).on('click', '.delete.icon', function(e){
  localStorage.removeItem('filterBy');
  $('.filtered > .menu').empty();
  update($('.connectedby').dropdown('get value'),null)
});

$(document).on('click', '.cancelmsg, .sendmsg', function(e){
  if($(e.currentTarget).hasClass('sendmsg')){
    $.ajax({
      url: '/sendmsg',
      method: 'POST',
      data: {
        msg: $('textarea').text(),
        receiver: $('.receiver').text()
      }
    })
    .done(function(status){
      console.log("msg sving is done" + status);
    })
  }
  $('.ui.modal.initiatemsg').modal('hide');

});

if(localStorage.getItem('filterBy')){
  console.log(localStorage.getItem('filterBy'))
  var labels = Object.keys(JSON.parse(localStorage.getItem('filterBy'))), label=null;
  for(var i = 0; i < labels.length; i++){
    label = labels[i] + '=' + JSON.parse(localStorage.getItem('filterBy'))[labels[i]] 
    $('.filtered > .menu').append('<div class="item">' + label + '</div>');
  }
  $('.filtered').dropdown('set selected', label);
}
// else $('.filtered').addClass('hidden');


////draw the force graph
var width = 960,
height = 660,
bindData = {},
threshold=0.05,
groupIdx = 0;

var force = d3.layout.force()
.gravity(0.4)
.charge(-600)
.linkDistance(80)
.size([width, height])
.friction(0.5)
// .alpha(0.005)
.on("tick", tick);

var svg = d3.select("#chart").append("svg")
.attr("width", width)
.attr("height", height)
 // .attr("transform", "translate(" + width / 4 + "," + height / 3 + ")");
 ;

 var link = svg.selectAll(".link"),
 node = svg.selectAll(".node");

 function Hierarchy(arr, linkType, callback){ //callback is the render function
  var nodes=[], links = [], nodeIdx = -1, tpc = {}, groupIdx=0, oIdx = 0; //record the logged user's id to mark it as the root
  if(arr.length==0) {
    console.log("no results passed");
    return null;
  }
  if(typeof(arr[0][linkType])=='object' || linkType=='goal'){
    for(var i=0; i<arr.length; i++){
      var arrayType = arr[i][linkType];
      if(linkType=='goal') arrayType = arr[i][linkType].split(',');
      nodeIdx = nodeIdx+1;

      var snd = {
        'id':arr[i].id,
        'gender': arr[i].gender==1?'M':'F',
        'type':'student',
        'student_id': arr[i].student_id,
        'title': arr[i].title,
        'institution': arr[i].institution,
        'degree': arr[i].degree,
        'prev_degree': arr[i].prev_degree,
        'group':groupIdx,
        'nationality':arr[i].nationality,
        'res':arr[i].RES,
        'name': arr[i].name,
        'idx':nodeIdx,
        'size':arrayType.length,
        'collapsed':false
      };
      if(arr[i].student_id==sessionStorage['username']){
        snd.start=true;
      }
      groupIdx+=1;

      nodes.push(snd);
      for(var j=0; j<arrayType.length; j++)
      {
        if(!tpc[arrayType[j]]){
          nodeIdx +=1
          tnd = {
            'id': linkType+'_'+arrayType[j],
            'name':arrayType[j],
            'size':1,
            'group':groupIdx,
            'idx':nodeIdx,
            'collapsed':false
          }
          groupIdx+=1;        
          nodes.push(tnd);
          links.push({
            'source':tnd.idx,
            'target':snd.idx
          });
          tpc[arrayType[j]]=tnd;
        }
        else {
          tpc[arrayType[j]]['size']+=1;

        links.push({
          'source': tpc[arrayType[j]].idx,
          'target': snd.idx
        });
      }
    }
  }
}
else { // linkType is a string
  for(var i=0; i<arr.length; i++){
    var commonAttr = arr[i][linkType];
    nodeIdx = nodeIdx+1;
    
    var snd = {
      'id':arr[i].id,
      'gender': arr[i].gender==1?'M':'F',
      'type':'student',
      'student_id': arr[i].student_id,
      'title': arr[i].title,
      'institution': arr[i].institution,
      'degree': arr[i].degree,
      'prev_degree': arr[i].prev_degree,
      'group':groupIdx,
      'nationality':arr[i].nationality,
      'res':arr[i].RES,
      'name': arr[i].name,
      'idx':nodeIdx,
      'size':1,
      'collapsed':false
    };
    if(arr[i].student_id==sessionStorage['username']){
      snd.start=true;
    }
    groupIdx+=1;

    nodes.push(snd);
    if(!tpc[commonAttr]){
      nodeIdx +=1
      tnd = {
        'id': linkType+'_'+commonAttr,
        'name':commonAttr,
        'size':1,
        'group':groupIdx,
        'idx':nodeIdx,
        'collapsed':false
      }
      groupIdx+=1;        
      nodes.push(tnd);
      links.push({
        'source':tnd.idx,
        'target':snd.idx
      });
      tpc[commonAttr]=tnd;
    }
    else {
      tpc[commonAttr]['size']+=1;

        links.push({
          'source': tpc[commonAttr].idx,
          'target': snd.idx
        });
      }

    }
  }
  callback(nodes,links);
}

function update(LinkType, filters){

  var url_link = filters?"/students/bystate/"+filters:"/students";
  console.log(url_link);
  $.ajax({
    url: url_link,
    method: "GET"
  })
  .done(function(studentsArr){
    console.log(studentsArr.length);
    if(!studentsArr.length){
      $('.info').removeClass('hidden');
    }
    Hierarchy(studentsArr, LinkType, DrawGraph);
      // console.log(bindData['links']);
      // console.log(bindData['links'].length);
      // DrawGraph(bindData['nodes'],bindData['links']);
    });
  // } //for the localstorage option, temporarily disabled for now

}

update("classes", localStorage.getItem('filterBy')?JSON.parse(localStorage.getItem('filterBy'))['state']:null);
function DrawGraph(nodes,links) {

  // Restart the force layout.
  force
  .nodes(nodes)
  .links(links)
  .start();

  // Update links.
  link = link.data([]);
  link.enter().append("line");
  link.exit().remove();

  link = link.data(links);


  link.enter().insert("line", ".node")
  .attr("class", function(d){
    return "link "+ "id-"+d.source+d.target;
  });
  link.exit().remove();

  // Update nodes.
  var n = nodes.length; nodes.forEach(function(d, i) {
    if(d.student_id==sessionStorage['username']){
      console.log('this is me, I am at' + d.x);
      d.x = width/2;
      d.y = height/2;
    }
    else d.x = d.y = width / n * i; });
  node = node.data([]);
  node.enter().append('g');
  node.exit().remove();
  node = node.data(nodes);
  var nodeEnter = node.enter().append("g")
  .attr("class", function(d){
    return d.type==="student"? "student node id-":"non-student id-" + d.idx + " node";
  })
  .on("click", click)
  .call(node_drag);


  node.exit().remove();
 // Append a circle
 nodeEnter.append("svg:circle")
 .attr("r", function(d) { return d.student_id!=sessionStorage['username']?Math.sqrt(d.size*12):10;  })
 .style("fill", function(d){ 
  if(d.student_id!=sessionStorage['username']) return d.type!=='student'?"#FB9128":"#34B521"; 
  else {
    console.log("this is red!!!")
    return "red";
  }
});

  //append image
  nodeEnter.append("svg:image")
  .attr("class", "node-img")
  .attr("xlink:href", function(d){ return d.type=='student'?"../images/user-icon_sm.png":"../images/hubspot.png"})
  .attr("x", "-8px")
  .attr("y", "-8px")
  .attr("width", "16px")
  .attr("height", "16px")
  .attr("r", function(d) { return Math.sqrt(d.size*12); })
  .attr("fill", function(d) { return d.group?"#3182bd":"#c6dbef";});
  
  nodeEnter.append("text")
  // .attr('text-anchor','end')
  .attr('dx',"3em")
  .attr("dy", ".35em")
  .attr("text-anchor", "left")
  .text(function(d, i) { 
    return d.name; 
  });
  
///pend tooltip
var tooltip = d3.select("#chart")
.append("div")
.attr("class", "tooltip")
.style("position", "absolute")
  .style("z-index", "20")//An element with greater stack order is always in front of an element with a lower stack order.
  .style("visibility", "hidden");
  
  var stringHTML1 = 
  '<div class="ui centered aligned padded grid">',
  stringHTML2=
  '</div><div class="ui blue button messageher" style="display: block">Click to message him/her!</div>';

  svg.selectAll(".node.student")
  .attr("opacity", 1)
  .on("mouseover", function(d, i) {
    svg.selectAll(".node").transition()
    .duration(250)
    .attr("opacity", function(d, j) {
      return j != i ? 0.6 : 1;
    })})
  .on("mousemove", function(d, i) {
    var self=d3.select(this);
    d3.select(this)
    .classed("hover", true)
    .attr("stroke", "#B30000")
    .attr("stroke-width", "0.5px");
    // if(d.name){
      // console.log(d);
      tooltip.html(stringHTML1 + '<div class="row intro"> <strong>'+ (d.name?d.name:'{name not provided}') + '</strong>'+  (d.gender=="F"?'<i class="icon female"></i>':'<i class="icon male"></i>') +
        '</div><div class="profession row intro"><div class="six wide column">'
        + '<strong>' + (d.title?d.title:'{title not provided}') + '</strong> at <strong>'+(d.institution?d.institution:'{institution not provided}') + '</strong>' + '</div></div>' + 
        '<div class="row intro country"><div class="six wide column">'
        + 'from <strong>' + (d.res?d.res:'{Residence not provided}')+ '</strong>' + '</div></div>' +
        '<div class="row prev intro"><div class="six wide column">'
        + 'with a <strong>' + (d.prev_degree?d.prev_degree:'{previous degree not provided}') + '</strong> beforehand</div></div>' +
        '<div class="row status intro"><div class="six wide column">'
        + 'now working as a <strong>' + (d.degree?d.degree:'{degree not provided}') + '</strong> student</div></div>' +
        stringHTML2)
      .style("visibility", "visible")
      .style("background","RGBA(215,247,211,0.63)")//green
      .style("left", (d3.event.pageX+self.node().getBoundingClientRect()['width']/2+"px"))
      .style("top", (d3.event.pageY-d3.select('.tooltip').node().getBoundingClientRect()['height']/2+self.node().getBoundingClientRect()['height']/2+"px"));
    // }

  })
  .on("mouseout", function(d, i) {
   svg.selectAll(".node")
   .transition()
   .duration(250)
   .attr("opacity", "1");
   d3.select(this)
   .classed("hover", false)
   .attr("stroke-width", "0px"), 
   tooltip.html(stringHTML1 + '<div class="row">'+ (d.name?d.name:'{name not provided}') +  (d.gender=="F"?'<i class="icon female"></i>':'<i class="icon male"></i>') +
    '</div><div class="profession row"><div class="six wide column">'
    + '<strong>' + (d.title?d.title:'{title not provided}') + '</strong> at <strong>'+(d.institution?d.institution:'{institution not provided}') + '</strong>' + '</div></div>' + 
    '<div class="row country"><div class="six wide column">'
    + 'from <strong>' + (d.res?d.res:'{Residence not provided}')+ '</strong>' + '</div></div>' +
    '<div class="row prev"><div class="six wide column">'
    + 'with a <strong>' + (d.prev_degree?d.prev_degree:'{previous degree not provided}') + '</strong> beforehand</div></div>' +
    '<div class="row status"><div class="six wide column">'
    + 'now working as a ' + (d.degree?d.degree:'{degree not provided}') + ' student</div></div>' +
        stringHTML2)//stringHTML1 + '<div class="row">'+ d.name + "</div>" + stringHTML2)
   .style("visibility", "hidden");
 });

  svg.selectAll(".node.non-student")
  .attr("opacity", 1)
  .on("mouseover", function(d, i) {
    svg.selectAll(".node").transition()
    .duration(250)
    .attr("opacity", function(d, j) {
      return j != i ? 0.6 : 1;
    })})
  .on("mousemove", function(d, i) {
    var self=d3.select(this);
    d3.select(this)
    .classed("hover", true)
    .attr("stroke", "#B30000")
    .attr("stroke-width", "0.5px");
    console.log(self.node().getBoundingClientRect()['width']/2+"px");
    // if(d.name){
      tooltip.html(stringHTML1 + '<div class="row"> There are <strong>&nbsp '+ (d.size) + ' </strong>&nbsp students connected through &nbsp<strong>'+  (d.name) +
        '</strong></div></div>')
      .style("visibility", "visible")
      .style("background","RGBA(251,145,40,0.13)") //orange for the type node
      .style("left", (d3.event.pageX+self.node().getBoundingClientRect()['width']/2+"px"))
      .style("top", (d3.event.pageY+self.node().getBoundingClientRect()['height']/2+"px"));
    // }

  })
  .on("mouseout", function(d, i) {
   svg.selectAll(".node")
   .transition()
   .duration(250)
   .attr("opacity", "1");
   d3.select(this)
   .classed("hover", false)
   .attr("stroke-width", "0px"), 
   tooltip.html(stringHTML1 + '<div class="row">'+ (d.name?d.name:'{name not provided}') +  (d.gender=="F"?'<i class="icon female"></i>':'<i class="icon male"></i>') +
    '</div><div class="profession row"><div class="six wide column">'
    + '<strong>' + (d.title?d.title:'{title not provided}') + '</strong> at <strong>'+(d.institution?d.institution:'{institution not provided}') + '</strong>' + '</div></div>' + 
    '<div class="row country"><div class="six wide column">'
    + 'from <strong>' + (d.res?d.res:'{Residence not provided}')+ '</strong>' + '</div></div>' +
    '<div class="row prev"><div class="six wide column">'
    + 'with a <strong>' + (d.prev_degree?d.prev_degree:'{previous degree not provided}') + '</strong> beforehand</div></div>' +
    '<div class="row status"><div class="six wide column">'
    + 'now working as a <strong>' + (d.degree?d.degree:'{degree not provided}') + '</strong> student</div></div>' +
        stringHTML2)//stringHTML1 + '<div class="row">'+ d.name + "</div>" + stringHTML2)
   .style("visibility", "hidden");
 });
}
var node_drag = d3.behavior.drag()
.on("dragstart", dragstart)
.on("drag", dragmove)
.on("dragend", dragend);

function dragstart(d, i) {
force.stop() // stops the force auto positioning before you start dragging
}

function dragmove(d, i) {
  d.px += d3.event.dx;
  d.py += d3.event.dy;
  d.x += d3.event.dx;
  d.y += d3.event.dy; 
  tick(); // this is the key to make it work together with updating both px,py,x,y on d !
}

function dragend(d, i) {
  d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
  tick();
  force.resume();
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
  .attr("y1", function(d) { return d.source.y; })
  .attr("x2", function(d) { return d.target.x; })
  .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { 
    var r=d.size?Math.sqrt(d.size*10):4.5;
    if(d.student_id==sessionStorage['username']&&d.start) {
     d.start = false;
     return d.x = width/2;
   }
   else return d.x = Math.max(r, Math.min(width - r, d.x)); 
 })
  .attr("cy", function(d) { 
    var r=d.size?Math.sqrt(d.size*10):4.5;
    if(d.student_id==sessionStorage['username']&&d.start) {
     d.start = false;
     return d.y = height/2;
   }
   else return d.y= Math.max(r, Math.min(width - r, d.y)); 
 })
  .attr("transform", function(d) { 
    return "translate(" + d.x + "," + d.y + ")"; 
  });
  // console.log('alpha is '+force.alpha());
  if(force.alpha()<threshold){
    force.stop()
  }
  //make yourself as the center
  // nodes[0].x = width / 2;
  // nodes[0].y = height / 2;
}




function color(d) {
  return d.group?"#3182bd":"#c6dbef";
}

// Toggle children on click.
function click(d) { //class subject does not get hidden, neither do students whose classes are more than one
  if (d3.event.defaultPrevented) return; // ignore drag
  if(d.type == 'student'){
    $('.receiver').html(d.name);
    $('.ui.modal.initiatemsg').modal('show');
  }
}
