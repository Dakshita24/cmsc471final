const width = 600;
const height = 400;


 //const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000);
 //const path = d3.geoPath(projection);


const colorScale = d3.scaleSequential()
  .domain([70, 90])
  .interpolator(d3.interpolateBlues);

  function loadAndDrawMap() {
    
    let mapData = {};
    const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", "0 0 975 610")  // Full USA size
  .attr("preserveAspectRatio", "xMidYMid meet");

const g = svg.append("g");

const projection = d3.geoAlbersUsa()
  .translate([487.5, 305])  // Centered
  .scale(1000);

const path = d3.geoPath().projection(projection);
  
    const colorScale = d3.scaleSequential()
      .domain([90, 70])
      .interpolator(d3.interpolateBlues);
  
    /*const tooltip = d3.select("body").append("div").attr("class", "tooltip"); */
    const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "white")
  .style("padding", "8px")
  .style("font-size", "20px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);
  
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));
  
    svg.call(zoom);
  
    Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
      d3.csv("/gender_pay_gap_by_state.csv")
    ]).then(([usData, earnings]) => {
      const us = topojson.feature(usData, usData.objects.states);
      earnings.forEach(d => {
        const state = d.State?.trim();
        const gapPercent = parseFloat(d.Gap_Percent);
        if (!state || isNaN(gapPercent)) return;
        mapData[state] = gapPercent;
      });
  
      g.selectAll("path")
        .data(us.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const value = mapData[d.properties.name];
          return value !== undefined ? colorScale(value) : "#ccc";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function (event, d) {
  d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
  const value = mapData[d.properties.name];

  tooltip
    .style("opacity", 1)
    .html(value !== undefined
      ? `<strong>${d.properties.name}</strong><br>Women earn ${value}% of what men earn`
      : `<strong>${d.properties.name}</strong><br>No data`);
})
.on("mousemove", function (event) {
  // Position tooltip near the cursor, slightly offset to avoid overlapping
  tooltip
     .style("left", `${event.pageX + 20}px`)
    .style("top", `${event.pageY + 20}px`);
})
.on("mouseout", function () {
  d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
 // tooltip.transition().duration(200).style("opacity", 0);
 tooltip.style("opacity", 0);
});
    });
  }
  

document.addEventListener("DOMContentLoaded", () => {
  loadAndDrawMap();
  drawEarningsChangeDivergingChart();
  drawRaceGenderIncomeBubbles();
  drawDotPlotEarningsByEducation()
});

function drawBarChart() {
  d3.csv("/Median weekly earnings of full-time wage and salary workers by occupation, 2023.csv").then(data => {
    data.forEach(d => {
      d.Women = +d.Women;
      d.Men = +d.Men;
    });
    // sorting from max to min
  data.sort((a, b) => Math.abs(b.Men - b.Women) - Math.abs(a.Men - a.Women));
const barWidth = 100; // Width per occupation group
const gap = 35;       // Gap between groups
const numBars = data.length;
const fullWidth = numBars * (barWidth + gap); // Dynamically set full width

const margin = { top: 35, right: 20, bottom: 450, left: 60 },
      width = fullWidth - margin.left - margin.right,
      height = 500;

    const svg = d3.select("#bar-chart")
  .append("svg")
  .attr("viewBox", `0 0 ${fullWidth} ${height + margin.top + margin.bottom}`)
  .attr("preserveAspectRatio", "xMinYMin meet")
  .classed("responsive-svg", true)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);


   const x = d3.scaleBand()
  .domain(data.map(d => d["Occupational group"]))
  .range([0, width])
  .padding(0.2);

const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => Math.max(d.Women, d.Men))])
  .nice()
  .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(["Women", "Men"])
      .range(["#f06292", "#64b5f6"]);

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    svg.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(0,${y(d["Occupational group"])})`)
      .selectAll("rect")
      .data(d => ["Women", "Men"].map(key => ({ key, value: d[key], label: d["Occupational group"] })))
      .join("rect")
      .attr("x", d => x(d.label) + (d.key === "Women" ? 0 : x.bandwidth() / 2))
.attr("width", x.bandwidth() / 2)
.attr("y", d => y(d.value))
.attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key))
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(100).style("opacity", 0.9);
        tooltip.html(`<strong>${d.label}</strong><br>${d.key}: $${d.value}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x))
  .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-0.8em")
  .attr("dy", "0.15em")
  .attr("transform", "rotate(-40)")
  .style("font-size", "30px");
/*
    const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(0, ${height + 60})`);

["Women", "Men"].forEach((key, i) => {
  const row = legend.append("g")
    .attr("transform", `translate(0, ${i * 25})`);

  row.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", color(key));

  row.append("text")
    .attr("x", 20)
    .attr("y", 12)
    .text(key)
    .style("font-size", "13px");
}); */

const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width - 100}, 0)`); // Positions legend in top-right

["Women", "Men"].forEach((key, i) => {
  const row = legend.append("g")
    .attr("transform", `translate(0, ${i * 30})`);

  row.append("rect")
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", color(key));

  row.append("text")
    .attr("x", 15)
    .attr("y", 20)
    .text(key)
    .style("font-size", "30px")
    .style("font-weight", "500");
});
  }

);
}

drawBarChart();

function drawLineChart() {
  const data = [
    { Year: 1979, GenderWageGap: 0.377 },
    { Year: 1980, GenderWageGap: 0.368 },
    { Year: 1981, GenderWageGap: 0.357 },
    { Year: 1982, GenderWageGap: 0.345 },
    { Year: 1983, GenderWageGap: 0.334 },
    { Year: 1984, GenderWageGap: 0.331 },
    { Year: 1985, GenderWageGap: 0.329 },
    { Year: 1986, GenderWageGap: 0.325 },
    { Year: 1987, GenderWageGap: 0.320 },
    { Year: 1988, GenderWageGap: 0.319 },
    { Year: 1989, GenderWageGap: 0.313 },
    { Year: 1990, GenderWageGap: 0.311 },
    { Year: 1991, GenderWageGap: 0.308 },
    { Year: 1992, GenderWageGap: 0.304 },
    { Year: 1993, GenderWageGap: 0.302 },
    { Year: 1994, GenderWageGap: 0.301 },
    { Year: 1995, GenderWageGap: 0.302 },
    { Year: 1996, GenderWageGap: 0.296 },
    { Year: 1997, GenderWageGap: 0.295 },
    { Year: 1998, GenderWageGap: 0.294 },
    { Year: 1999, GenderWageGap: 0.293 },
    { Year: 2000, GenderWageGap: 0.293 },
    { Year: 2001, GenderWageGap: 0.294 },
    { Year: 2002, GenderWageGap: 0.296 },
    { Year: 2003, GenderWageGap: 0.296 },
    { Year: 2004, GenderWageGap: 0.293 },
    { Year: 2005, GenderWageGap: 0.292 },
    { Year: 2006, GenderWageGap: 0.291 },
    { Year: 2007, GenderWageGap: 0.292 },
    { Year: 2008, GenderWageGap: 0.292 },
    { Year: 2009, GenderWageGap: 0.291 },
    { Year: 2010, GenderWageGap: 0.293 },
    { Year: 2011, GenderWageGap: 0.292 },
    { Year: 2012, GenderWageGap: 0.292 },
    { Year: 2013, GenderWageGap: 0.293 },
    { Year: 2014, GenderWageGap: 0.293 },
    { Year: 2015, GenderWageGap: 0.293 },
    { Year: 2016, GenderWageGap: 0.293 },
    { Year: 2017, GenderWageGap: 0.293 },
    { Year: 2018, GenderWageGap: 0.293 },
    { Year: 2019, GenderWageGap: 0.294 },
    { Year: 2020, GenderWageGap: 0.295 },
    { Year: 2021, GenderWageGap: 0.296 },
    { Year: 2022, GenderWageGap: 0.297 },
    { Year: 2023, GenderWageGap: 0.297 }
  ];

const margin = { top: 20, right: 20, bottom: 40, left: 60 },
      fullWidth = 500,
      fullHeight = 240,
      width = fullWidth - margin.left - margin.right,
      height = fullHeight - margin.top - margin.bottom;
const tooltip = d3.select("#tooltip");

const svg = d3.select("#line-chart")
  .append("svg")
  .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`)
  .attr("preserveAspectRatio", "xMinYMin meet")
  .classed("responsive-svg", true)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0.25, 0.4])  // Adjusted for visual clarity
    .range([height, 0]);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.GenderWageGap));

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#4c2c92")
    .attr("stroke-width", 2.5)
    .attr("d", line);

    const focus = svg.append("g")
  .style("display", "none");

focus.append("circle")
  .attr("r", 4)
  .attr("fill", "#4c2c92");

focus.append("text")
    .attr("x", 0)
  .attr("y", -10)  // 10px above the circle
  .attr("text-anchor", "middle") // Center the text horizontally
  .attr("font-size", "12px")
  .attr("fill", "#333");

svg.append("rect")
  .attr("class", "overlay")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "none")
  .attr("pointer-events", "all")
  .on("mouseover", () => focus.style("display", null))
  .on("mouseout", () => focus.style("display", "none"))
  .on("mousemove", function(event) {
    const bisect = d3.bisector(d => d.Year).left;
    const x0 = x.invert(d3.pointer(event)[0]);
    const i = bisect(data, x0);
    const d = data[i];

    focus.attr("transform", `translate(${x(d.Year)},${y(d.GenderWageGap)})`);
    focus.select("text").text(`${(d.GenderWageGap * 100).toFixed(1)}%`);
  });



  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 35)
    .attr("text-anchor", "middle")
    .attr("fill", "#444")
    .text("Year")
     .style("font-size", "14px");;

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .attr("fill", "#444")
    .text("Wage Gap (vs Men)")
     .style("font-size", "14px");;
}

drawLineChart();


function drawEarningsChangeDivergingChart() {
  d3.csv("/gender_pay_gap_education_2023.csv").then(data => {
    data.forEach(d => {
      d.Men = +d.Men;
      d.Women = +d.Women;
    });

    const margin = { top: 20, right: 60, bottom: 40, left: 200 },
          width = 700 - margin.left - margin.right,
          height = 300;

    const svg = d3.select("#education-change-chart")
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .classed("responsive-svg", true)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const educationLevels = data.map(d => d["Education Level"]);
    const y = d3.scaleBand()
      .domain(educationLevels)
      .range([0, height])
      .padding(0.3);

    const x = d3.scaleLinear()
      .domain([-30, 50])
      .range([0, width]);

    const color = d3.scaleOrdinal()
      .domain(["Men", "Women"])
      .range(["#c6dbef", "#3f007d"]);

    // Center zero line
    svg.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    // Draw bars
    svg.selectAll("g.bar-group")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", d => `translate(0, ${y(d["Education Level"])})`)
      .call(g => {
        // Men bar (left)
        g.append("rect")
          .attr("x", d => x(Math.min(0, -d["Gap %"])))
          .attr("y", 0)
          .attr("width", d => Math.abs(x(0) - x(-d["Gap %"])))
          .attr("height", y.bandwidth() / 2)
          .attr("fill", color("Men"));

        // Women bar (right)
        g.append("rect")
          .attr("x", x(0))
          .attr("y", y.bandwidth() / 2)
          .attr("width", d => Math.abs(x(d["Gap %"]) - x(0)))
          .attr("height", y.bandwidth() / 2)
          .attr("fill", color("Women"));
      });

    // X-axis
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => `${d}%`));

    // Y-axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 130}, 0)`);

    ["Women", "Men"].forEach((key, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(key));
      row.append("text").attr("x", 16).attr("y", 10).text(key).style("font-size", "12px");
    });
  });
}



function drawRaceGenderIncomeBubbles() {
  const data = [
    { "race": "White", "gender": "Male", "income": 67590 },
    { "race": "White", "gender": "Female", "income": 43695 },
    { "race": "Black", "gender": "Male", "income": 45103 },
    { "race": "Black", "gender": "Female", "income": 37964 },
    { "race": "Asian", "gender": "Male", "income": 80365 },
    { "race": "Asian", "gender": "Female", "income": 53361 },
    { "race": "Hispanic", "gender": "Male", "income": 44297 },
    { "race": "Hispanic", "gender": "Female", "income": 32020 }
  ];

  const width = 1200;
  const height = 600;
  const padding = 60;

  const svg = d3.select("#race-income-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 2px 10px rgba(33, 177, 71, 0.1)")
    .style("font-size", "20px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const x = d3.scalePoint()
    .domain([...new Set(data.map(d => d.race))])
    .range([padding, width - padding])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.income) * 1.1])
    .range([height - padding, padding]);

  const r = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.income)])
    .range([10, 40]);

  const color = d3.scaleOrdinal()
    .domain(["Male", "Female"])
    .range(["#ADD8E6", "#FFC0CB"]);

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.race))
    .attr("cy", d => y(d.income))
    .attr("r", d => r(d.income))
    .attr("fill", d => color(d.gender))
    .attr("opacity", 0.8)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${d.gender} ${d.race}</strong><br>Income: $${d.income.toLocaleString()}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  svg.selectAll("text.label")
    .data(data)
    .join("text")
    .attr("class", "label")
    .attr("x", d => x(d.race))
    .attr("y", d => y(d.income))
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .text(d => d.gender);

  svg.append("g")
    .attr("transform", `translate(0, ${height - padding })`)
    .call(d3.axisBottom(x)).style("font-size", "16px");

  svg.append("g")
    .attr("transform", `translate(${padding}, 0)`)
    .call(d3.axisLeft(y)).selectAll("text")
  .style("font-size", "16px")
  .attr("fill", "#333");
}


function drawDotPlotEarningsByEducation() {
  d3.csv("/earningsbysexandeducationalattainment.csv").then(data => {
    data.forEach(d => d["Measure Values"] = +d["Measure Values"].replace(/,/g, ""));

    const margin = { top: 20, right: 80, bottom: 40, left: 200 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#education-dot-chart")
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .classed("responsive-svg", true)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const educationLevels = Array.from(new Set(data.map(d => d.Education)));
    const genders = ["Men", "Women"];

    const y = d3.scaleBand()
      .domain(educationLevels)
      .range([0, height])
      .padding(0.4);

    const x = d3.scaleLinear()
      .domain([600, d3.max(data, d => d["Measure Values"]) * 1.1])
      .range([0, width]);

    const color = d3.scaleOrdinal()
      .domain(genders)
      .range(["#64b5f6", "#f06292"]);

    svg.append("g").call(d3.axisLeft(y));
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d => `$${d}`));

      const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "white")
  .style("padding", "6px 10px")
  .style("border-radius", "4px")
  .style("font-size", "20px")
  .style("pointer-events", "none")
  .style("opacity", 0);
/*
    svg.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d["Measure Values"]))
      .attr("cy", d => y(d.Education) + (d.Sex === "Men" ? -6 : 6))
      .attr("r", 6)
      .attr("fill", d => color(d.Sex)); */
      svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => x(d["Measure Values"]))
  .attr("cy", d => y(d.Education) + (d.Sex === "Men" ? -6 : 6))
  .attr("r", 6)
  .attr("fill", d => color(d.Sex))
  .on("mouseover", function(event, d) {
    d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);

    tooltip
      .style("opacity", 1)
      .html(`<strong>${d.Education}</strong><br>${d.Sex}: $${d["Measure Values"].toLocaleString()}`);
  })
  .on("mousemove", function(event) {
    tooltip
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY + 10}px`);
  })
  .on("mouseout", function() {
    d3.select(this).attr("stroke", null);
    tooltip.transition().duration(200).style("opacity", 0);
  });


    // Legend
    const legend = svg.append("g").attr("transform", `translate(${width - 60}, 10)`);
    genders.forEach((gender, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row.append("circle").attr("r", 6).attr("fill", color(gender));
      row.append("text").attr("x", 12).attr("y", 4).text(gender).style("font-size", "12px");
    }); 
  });
}
