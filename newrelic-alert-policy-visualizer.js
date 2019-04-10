// URL: https://observablehq.com/@tanben/newrelic-alert-policy-visualizer
// Title: New Relic Alert Policy Visualizer
// Author: Benedicto Tan (@tanben)
// Version: 512
// Runtime version: 1

const m0 = {
  id: "ef133e525e148867@512",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# New Relic Alert Policy Visualizer
Graph your New Relic Alert policies and Conditions using your account's API key.
Note: This only shows application alert conditions and does not include NRQL alert conditions.

For documentation on the New Relic APIs for Alert Policies and Conditions you can check out this link to the [New Relic API Explorer ](https://rpm.newrelic.com/api/explore)
`
)})
    },
    {
      name: "viewof apiKey",
      inputs: ["text"],
      value: (function(text){return(
text({placeholder: "API Key", description: "Paste your API key here and hit GO", submit: "Go"})
)})
    },
    {
      name: "apiKey",
      inputs: ["Generators","viewof apiKey"],
      value: (G, _) => G.input(_)
    },
    {
      name: "chart1",
      inputs: ["data","tree","d3","DOM","width"],
      value: (function(data,tree,d3,DOM,width)
{
  if (!data){
    return null
  }
  // console.log("*** data"+ JSON.stringify(data))
  const root = tree(data);

  let x0 = Infinity;
  let x1 = -x0;
  root.each(d => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const svg = d3.select(DOM.svg(width, x1 - x0 + root.dx * 2))
      .style("width", "100%")
      .style("height", "auto");

  const g = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);

  const link = g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
  .selectAll("path")
    .data(root.links())
    .enter().append("path")
      .attr("d", d => `
        M${d.target.y},${d.target.x}
        C${d.source.y + root.dy / 2},${d.target.x}
         ${d.source.y + root.dy / 2},${d.source.x}
         ${d.source.y},${d.source.x}
      `);

  const node = g.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants().reverse())
    .enter().append("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
      .attr("fill", d => d.children ? "#555" : "#999")
      .attr("r", 2.5);

  node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -6 : 6)
      .text(d => d.data.name)
    .filter(d => d.children)
      .attr("text-anchor", "end")
    .clone(true).lower()
      .attr("stroke", "white");

  return svg.node();
}
)
    },
    {
      inputs: ["html","applications"],
      value: (function(html,applications){return(
html`

<style>
#entries tr td {
  vertical-align: top;
}
#entries tr td:first-child {
  padding-right:3rem;
}
#entries tr td:nth-child(2) {
  font-family: monospace;
  padding-right:3rem;
}
</style>


<div>
<table id='entries'>
  <thead>
    <tr>
      <th></th>
      <th>APM Application</th>
      <th>Policies</th>
      <th>Conditions</th>
      <th>Conditions Count</th>
    </tr>
  </thead>
${(applications)
  .map(({name,policy="", condition="", count=0}) => html`
  <tr>
    <td>${!!(count >0) ? `✓` : 'x'}</td>
    <td>${name}</td>
    <td>${policy}</td>
    <td>${condition}</td>
    <td>${count}</td>

  </tr>
`)}

</table>
`
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`# Vars
`
)})
    },
    {
      name: "applications",
      inputs: ["apiKey","getApplications","data"],
      value: (async function(apiKey,getApplications,data)
{
   if (!apiKey) return []
  
   let hashMap={}
   let arr = await getApplications()

    arr.forEach( ({id,name})=>{
      hashMap[id]={ id, name, count:0}
    })
  
    data.children.forEach( policy=>{
    policy.children.forEach( ({name, entities})=>{
       entities.forEach( entity=>{
          let application = hashMap[entity] || null
          // console.log("entity=" +entity)
          if (application){
             application.count++ 
            application.condition= (application.condition)?(application.condition+"<br/><br/>"+ name):name
            application.policy= (application.policy)?(application.policy+"<br/><br/>"+ policy.name):policy.name
          }
       })
    })
  })
  
  let keys= Object.keys(hashMap)
  let applications=[]
  keys.forEach( key=>{
    applications.push(hashMap[key])
  })
  
  return applications
}
)
    },
    {
      name: "data",
      inputs: ["apiKey","getPolicies","getConditions"],
      value: (async function(apiKey,getPolicies,getConditions)
{
  if (!apiKey){
   return null 
  }
  let policies= await getPolicies()
  let conditionList=[]
  
  policies.forEach (  ({id,name}) =>{

    let conditions=  getConditions({id,name})
     conditionList.push( conditions )
  })

  return Promise.all(conditionList).then( conditions=>{
    return  {name:"Policies", "children":conditions}

  })
  
}
)
    },
    {
      name: "width",
      value: (function(){return(
932
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md` # Methods


`
)})
    },
    {
      name: "getApplications",
      inputs: ["apiKey","get"],
      value: (function(apiKey,get){return(
async function getApplications() {

  let url='https://api.newrelic.com/v2/applications.json'
  let headers={ headers: new Headers( {
                  "accept":  "application/json",
                  "X-Api-key" : `${apiKey}`
              }) }
  
  let [applications, error] =  await get({url, headers}, (data)=>{
      if (!data || (data && data.applications.length == 0)){
        return []
      }
    
      return data.applications
  
   })
  return applications
}
)})
    },
    {
      name: "getConditions",
      inputs: ["apiKey","get"],
      value: (function(apiKey,get){return(
async function getConditions({id,name}) {
  let url=`https://api.newrelic.com/v2/alerts_conditions.json?policy_id=${id}`
  let headers={ headers: new Headers( {
                  "accept":  "application/json",
                  "X-Api-key" : `${apiKey}`,

              }) }
  
  let [conditions, error] =  await get({url, headers}, (data)=>{
      if (!data || (data && data.conditions.length == 0)){
        return []
      }
    
      return data.conditions.map( (condition)=> ({name:condition.name, entities:condition.entities}))
   })

  return {name, children:conditions}
}
)})
    },
    {
      name: "getPolicies",
      inputs: ["apiKey","get"],
      value: (function(apiKey,get){return(
async function getPolicies() {

  let url='https://api.newrelic.com/v2/alerts_policies.json'
  let headers={ headers: new Headers( {
                  "accept":  "application/json",
                  "X-Api-key" : `${apiKey}`
              }) }
  
  let [policies, error] =  await get({url
                                      , headers}, (data)=>{
      if (!data || (data && data.policies.length == 0)){
        return []
      }
    
      return data.policies
  
   })
  return policies
}
)})
    },
    {
      name: "get",
      value: (function(){return(
async function get( {url , headers, page=1}, cb){
  let response;
 
  try{
    let tmpUrl =  (url.includes("?"))?(`${url}&page=${page}`):( `${url}?page=${page}`)
    response =  await fetch(tmpUrl, headers)
  }catch(err){
    return [null, err]
  }
  

  if (!response.ok){
    console.log(`get eror=${response.error}`);
    return [null, response.error];
  }
  

  let data = cb (await response.json());
  
  if (data && data.length > 0){
    page ++;
    let tmpUrl = `${url}?page=${page}`
    
    let [tmpResponse,error]  = await get({tmpUrl, headers, page}, cb);

    if (error !=null){
      return [data, error]
    }
    
    let tmpData = cb (tmpResponse);
    if (tmpData && tmpData.length >0){
          data.put( tmpData )
    }
  }

  return  [data , null]
}
)})
    },
    {
      name: "tree",
      inputs: ["d3","width"],
      value: (function(d3,width){return(
data => {
  const root = d3.hierarchy(data)
      .sort((a, b) => (a.height - b.height) || a.data.name.localeCompare(b.data.name));
  root.dx = 10;
  root.dy = width / (root.height + 1);
  return d3.cluster().nodeSize([root.dx, root.dy])(root);
}
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`# Imports
`
)})
    },
    {
      from: "@jashkenas/inputs",
      name: "text",
      remote: "text"
    },
    {
      name: "d3",
      inputs: ["require"],
      value: (function(require){return(
require("https://d3js.org/d3.v5.min.js")
)})
    }
  ]
};

const m1 = {
  id: "@jashkenas/inputs",
  variables: [
    {
      name: "text",
      inputs: ["input"],
      value: (function(input){return(
function text(config = {}) {
  const {
    value,
    title,
    description,
    autocomplete = "off",
    maxlength,
    minlength,
    pattern,
    placeholder,
    size,
    submit
  } = config;
  if (typeof config == "string") value = config;
  const form = input({
    type: "text",
    title,
    description,
    submit,
    attributes: {
      value,
      autocomplete,
      maxlength,
      minlength,
      pattern,
      placeholder,
      size
    }
  });
  form.output.remove();
  form.input.style.fontSize = "1em";
  return form;
}
)})
    },
    {
      name: "input",
      inputs: ["html","d3format"],
      value: (function(html,d3format){return(
function input(config) {
  let {
    form,
    type = "text",
    attributes = {},
    action,
    getValue,
    title,
    description,
    format,
    display,
    submit,
    options
  } = config;
  const wrapper = html`<div></div>`;
  if (!form)
    form = html`<form>
	<input name=input type=${type} />
  </form>`;
  Object.keys(attributes).forEach(key => {
    const val = attributes[key];
    if (val != null) form.input.setAttribute(key, val);
  });
  if (submit)
    form.append(
      html`<input name=submit type=submit style="margin: 0 0.75em" value="${
        typeof submit == "string" ? submit : "Submit"
      }" />`
    );
  form.append(
    html`<output name=output style="font: 14px Menlo, Consolas, monospace; margin-left: 0.5em;"></output>`
  );
  if (title)
    form.prepend(
      html`<div style="font: 700 0.9rem sans-serif;">${title}</div>`
    );
  if (description)
    form.append(
      html`<div style="font-size: 0.85rem; font-style: italic;">${description}</div>`
    );
  if (format) format = typeof format === "function" ? format : d3format.format(format);
  if (action) {
    action(form);
  } else {
    const verb = submit
      ? "onsubmit"
      : type == "button"
      ? "onclick"
      : type == "checkbox" || type == "radio"
      ? "onchange"
      : "oninput";
    form[verb] = e => {
      e && e.preventDefault();
      const value = getValue ? getValue(form.input) : form.input.value;
      if (form.output) {
        const out = display ? display(value) : format ? format(value) : value;
        if (out instanceof window.Element) {
          while (form.output.hasChildNodes()) {
            form.output.removeChild(form.output.lastChild);
          }
          form.output.append(out);
        } else {
          form.output.value = out;
        }
      }
      form.value = value;
      if (verb !== "oninput")
        form.dispatchEvent(new CustomEvent("input", { bubbles: true }));
    };
    if (verb !== "oninput")
      wrapper.oninput = e => e && e.stopPropagation() && e.preventDefault();
    if (verb !== "onsubmit") form.onsubmit = e => e && e.preventDefault();
    form[verb]();
  }
  while (form.childNodes.length) {
    wrapper.appendChild(form.childNodes[0]);
  }
  form.append(wrapper);
  return form;
}
)})
    },
    {
      name: "d3format",
      inputs: ["require"],
      value: (function(require){return(
require("d3-format@1")
)})
    }
  ]
};

const notebook = {
  id: "ef133e525e148867@512",
  modules: [m0,m1]
};

export default notebook;
