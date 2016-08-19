//dropdown for choose types of visualized hub
$('.ui.fluid.selection.dropdown').dropdown('set selected','classes')
.dropdown({onChange: function(value, text, $selectedItem){
    // console.log(value);
    // console.log(text);
    // console.log($selectedItem);
    update(value)

  }});
////draw the force graph
var width = 960,
height = 500,
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
  var nodes=[], links = [], nodeIdx = -1, tpc = {}, groupIdx=0;
  for(var i=0; i<arr.length; i++){
    var arrayType = arr[i][linkType];
    nodeIdx = nodeIdx+1;

    var snd = {
      'id':arr[i].id,
      'gender': arr[i].gender==1?'M':'F',
      'type':'student',
      'group':groupIdx,
      'name': arr[i].name,
      'idx':nodeIdx,
      'size':arrayType.length,
      'collapsed':false
    };

    groupIdx+=1;
    
    if(snd.name==='Tianchang Luo'){
      console.log(snd);
    }
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
        // console.log('nodes length is'+nodes.length)

        links.push({
          'source': tpc[arrayType[j]].idx,
          'target': snd.idx
        });
      }
    }
    // console.log('nodeidx is '+nodeIdx);
    // console.log(nodes.length);
  }
  callback(nodes,links);
  // return {'nodes':nodes, 'links':links}
}

function update(LinkType){
  // request data from the db
  if(localStorage.getItem('allstudents'))
  {
    Hierarchy(localStorage.getItem('allstudents'), LinkType, DrawGraph);
    
    
  }
  else {
    $.ajax({
      url: "/allstudents",
      method: "GET"
    })
    .done(function(studentsArr){
      console.log(studentsArr.length);
      Hierarchy(studentsArr, LinkType, DrawGraph);
      // console.log(bindData['links']);
      // console.log(bindData['links'].length);
      // DrawGraph(bindData['nodes'],bindData['links']);
    });
  }

}

update("classes");
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
    d.x = d.y = width / n * i; });
  node = node.data([]);
  node.enter().append('g');
  node.exit().remove();
  node = node.data(nodes);//, function(d) { return d.id; });
  var nodeEnter = node.enter().append("g")
  .attr("class", function(d){
    return d.type==="student "? "student id-":"non-student id-" + d.idx + " node";
  })
  .on("click", click)
  .call(node_drag);


  node.exit().remove();
 // Append a circle
 nodeEnter.append("svg:circle")
 .attr("r", function(d) { return Math.sqrt(d.size*12);  })
 .style("fill", "#FB9128");
  // var color = d3.scale.ordinal(d3.scale.category20c);
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
  
  // nodeEnter.append("circle")
  // .style("stroke-width", 2)
  // .style("stroke-opacity", 1)
  // .attr("r", function(d) { return d.size?Math.sqrt(d.size*10):4.5; })
  // .attr("fill", function(d) { return "url(#" + d.type=='student'?"images/user-icon_sm.png":"../images/stuff.png" + ")"}); 
  // nodeEnter.append("circle")
  // .attr("r", function(d) { return d.size?Math.sqrt(d.size*10):4.5; })
  // .attr("fill", function(d) { return d.group?"#3182bd":"#c6dbef";; });

  nodeEnter.append("text")
  // .attr('text-anchor','end')
  .attr('dx',"3em")
  .attr("dy", ".35em")
  .attr("text-anchor", "left")
  .text(function(d, i) { 
    console.log("this is node " + i + " enter "+ d.name)
    return d.name; });
  
///pend tooltip
var tooltip = d3.select("#chart")
.append("div")
.attr("class", "tooltip")
.style("background","RGBA(251,225,230,0.63)")
.style("position", "absolute")
  .style("z-index", "20")//An element with greater stack order is always in front of an element with a lower stack order.
  .style("visibility", "hidden");
  
  var stringHTML1 = 
  '<div class="ui centered aligned padded grid">',
  stringHTML2=
  '</div><div class="ui blue button gotostudent" style="display: block">Click to see more!</div>';

  svg.selectAll(".node")
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
    if(d.name){
      console.log('d is '+d);
      console.log(d.gender);
      console.log(d3.select(this));
      console.log(d.gender=="F");
      console.log(d.gender=="F"?"female":"male");

      tooltip.html( stringHTML1 + '<div class="row">'+ d.name + '</div><div class="row"><div class="six wide column">'
       + (d.gender=="F"?'<i class="icon female"></i>':'<i class="icon male"></i>') + '</div></div>' + stringHTML2)
      .style("visibility", "visible")
      .style("left", (d3.event.pageX-$("#chart").position().left+d3.select('.tooltip').node().getBoundingClientRect()['width']/2+"px"))
      .style("top", (d3.event.pageY-$("#chart").position().top+"px"));
    }

  })
  .on("mouseout", function(d, i) {
   svg.selectAll(".node")
   .transition()
   .duration(250)
   .attr("opacity", "1");
   d3.select(this)
   .classed("hover", false)
   .attr("stroke-width", "0px"), 
   tooltip.html(stringHTML1 + '<div class="row">'+ d.name + '</div><div class="row"><div class="six wide column">'
       + (d.gender=="F"?'<i class="icon female"></i>':'<i class="icon male"></i>') + '</div></div>' + stringHTML2)//stringHTML1 + '<div class="row">'+ d.name + "</div>" + stringHTML2)
   .style("visibility", "hidden");
 })
////end of tooltip  
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
    return d.x = Math.max(r, Math.min(width - r, d.x)); })
  .attr("cy", function(d) { 
    var r=d.size?Math.sqrt(d.size*10):4.5;
    return d.y = Math.max(r, Math.min(height - r, d.y)); })
  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  // console.log('alpha is '+force.alpha());
  if(force.alpha()<threshold){
    force.stop()
  }
}


function color(d) {
  return d.group?"#3182bd":"#c6dbef";
}

// Toggle children on click.
function click(d) { //class subject does not get hidden, neither do students whose classes are more than one
  if (d3.event.defaultPrevented) return; // ignore drag
  // if (d.type!=='student' && !d.collapsed) {//the collapsible node of different connecting subject
  //   var hideIdx = d.idx, ls = bindData['links'], hideStds = [];
  //   for(var i = 0; i < ls.length; i++){
  //     if (ls[i].source == hideIdx){
  //       hideStds.push(ls[i].target);
  //       $('.link, .id-'+ls[i].source+ls[i].target).addClass('hidden');
  //     }
  //   }
  //   for(var i = 0; i < hideStds.length; i++){
  //     $('.node, id-'+hideStds[i]).addClass('hidden')
  //   }

  // } else if(d.collapsed) {
  //   var hideIdx = d.idx, ls = bindData['links'], hideStds = [];
  //   for(var i = 0; i < ls.length; i++){
  //     if (ls[i].source == hideIdx){
  //       hideStds.push(ls[i].target);
  //       $('.link, .id-'+ls[i].source+ls[i].target).removeClass('hidden');
  //     }
  //   }
  //   for(var i = 0; i < hideStds.length; i++){
  //     $('.node, id-'+hideStds[i]).removeClass('hidden')
  //   }
  // }
  // else {
  //   console.log('student node is not collapsible');
  // }
  // update(bindData['nodes'], bindData['links']);
}
