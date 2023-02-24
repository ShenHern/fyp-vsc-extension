const blue = "#007acc";
const red = "#D16969";
const green = "#6A9955";
export const CytoscapeStylesheet: Array<cytoscape.Stylesheet> = [ 
    { 
      selector: "node", 
      style: { 
        "background-color": blue, 
        width: function(e) {
          let width : any = "label";
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")){
            width = 0.01;
          }
          return width
        },
        height: function(e) {
          let height : any = "label";
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")){
            height = 0.01;
          }
          return height
        },
        // a single "padding" is not supported in the types :( 
        "padding-top": function(e) {
          let padding : any = "15";
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")){
            padding = "0";
          }
          return padding
        },  
        "padding-bottom": function(e) {
          let padding : any = "15";
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")){
            padding = "0";
          }
          return padding
        }, 
        "padding-left": function(e) {
          let padding : any = "15";
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")){
            padding = "0";
          }
          return padding
        }, 
        "padding-right": function(e) {
          let padding : any = "15";
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")){
            padding = "0";
          }
          return padding
        },  
        // this fixes the text being shifted down on nodes (sadly no fix for edges, but it's not as obvious there without borders) 
        "text-margin-y": 0,
        "text-margin-x": function(e) {
          let margin : any = 0;
          if (e.data("label").includes("#")) {
            margin = -10;
          }
          return margin
        }, 
        shape: function(e) {
          let shape : any = "round-rectangle";
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")){
            shape = "ellipse";
          }
          if (e.data("label").includes("#")) {
            shape = "tag";
          }
          return shape
        },
        opacity: 1
      }, 
    }, 
    { 
      selector: "node[label]", 
      style: { 
        label: "data(label)", 
        "font-size": function(e) {
          let size = "20" as any;
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")) {
            size = "0.1";
          }
          return size;
        },
        color: "white", 
        "text-halign": "center", 
        "text-valign": "center", 
        "background-color": function(e) {
          let color = blue as any;
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")) {
            color = "white";
          }
          return color;
        },
        'border-width': function(e) {
          let width = 1 as any;
          if ((e.data("id").includes("from") || e.data("id").includes("to")) && !e.data("label").includes("#")) {
            width = 0;
          }
          return width;
        },
        'border-color': 'white'
      }, 
    },
    { 
      selector: "edge", 
      style: { 
        "curve-style": "straight", 
        "target-arrow-shape": function(e) {
          let arrow : any = "triangle";
          if (e.data("source").includes("-start")){
            arrow = "none";
          }
          return arrow
        },
        width: 1.5,
        "line-opacity": 1,
        'line-color': function(e) {
          let color = "white";
          if (e.data("source").includes("-start")){
            color = "white";
          }
          return color
        },
      }, 
    }, 
    { 
      selector: "edge[label]", 
      style: { 
        label: "data(label)", 
        "font-size": "20",
        "color": "black",
        "text-background-color": "white", 
        "text-background-opacity": 1, 
        "text-background-padding": "5px", 
        "text-margin-y": -5, 
        // so the transition is selected when its label/name is selected 
        "text-events": "yes",
        'arrow-scale': 1.5,
        'target-arrow-color': 'white',
        'line-color': 'white',
        'line-style': function(e) {
          let style = 'solid' as any;
          if (e.data("label").includes("AGREE")) {
            style = 'dashed'
          }
          return style
        }
      }, 
    }, 
    {
      selector: "edge:selected",
      style: {
        label: "data(label)", 
        "font-size": "20",
        "color": "black",
        "text-border-opacity": 1,
        "text-border-width": 5,
        "text-border-color": blue,
        'line-color': function(e) {
          let color : any = blue;
          if (e.data("source").includes("-start")){
            color = "white";
          }
          return color
        },
        'target-arrow-color': function(e) {
          let color : any = blue;
          if (e.data("source").includes("-start")){
            color = "white";
          }
          return color
        },
      }
    },
    {
      selector: ".Children",
      style: {
        label: "data(label)", 
        "font-size": "20",
        "color": "white",
        "text-border-opacity": 0,
        "text-border-width": 5,
        "text-background-color": green,
        'line-color': function(e) {
          let color : any = green;
          if (e.data("source").includes("-start")){
            color = "white";
          }
          return color
        },
        'target-arrow-color': function(e) {
          let color : any = green;
          if (e.data("source").includes("-start")){
            color = "white";
          }
          return color
        },
      }
    },
    {
      selector: ".Parent",
      style: {
        label: "data(label)", 
        "font-size": "20",
        "text-border-opacity": 0,
        "color": "white",
        "text-border-width": 5,
        "text-background-color": red,
        'line-color': function(e) {
          let color : any = red;
          if (e.data("source").includes("-start")){
            color = "white";
          }
          return color
        },
        'target-arrow-color': function(e) {
          let color : any = red;
          if (e.data("source").includes("-start")){
            color = "white";
          }
          return color
        },
      }
    }
  ];
  
  export const sidePanelOptions = {
    duration: 50,
    offset: 50
  };