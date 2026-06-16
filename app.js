/* ============ deck engine ============ */
const slides = [...document.querySelectorAll('.slide')];
const deck = document.getElementById('deck');
const dots = document.getElementById('dots');
const counter = document.getElementById('counter');
let cur = 0;

slides.forEach((_,i)=>{
  const d=document.createElement('button');d.className='dot';
  d.setAttribute('aria-label','Go to slide '+(i+1));
  d.onclick=()=>go(i);dots.appendChild(d);
});

/* keyboard hint: only on slide 0, after 5s of inactivity, slow dissolve-in */
const kbdHint=document.getElementById('kbdHint');
let hintTimer=null;
function scheduleHint(i){
  clearTimeout(hintTimer);
  kbdHint.classList.remove('show');
  if(i===0) hintTimer=setTimeout(()=>kbdHint.classList.add('show'),5000);
}

function go(i){
  i=Math.max(0,Math.min(slides.length-1,i));
  scheduleHint(i);
  if(i===cur && slides[cur].classList.contains('active')) return;
  slides.forEach((s,k)=>{
    s.classList.toggle('active',k===i);
    s.classList.toggle('exit-left',k<i);
  });
  cur=i;
  // chrome theme
  deck.classList.toggle('on-dark', slides[i].dataset.theme==='dark');
  // dot progress: past = done, current = active
  [...dots.children].forEach((d,k)=>{
    d.classList.toggle('active',k===i);
    d.classList.toggle('done',k<i);
  });
  counter.textContent = (i+1)+' / '+slides.length;
  document.getElementById('prevBtn').disabled = i===0;
  document.getElementById('nextBtn').disabled = i===slides.length-1;
  // animations
  animateCounts(slides[i]);
  if(slides[i].dataset.chart) initChart(slides[i].dataset.chart);
}

document.getElementById('prevBtn').onclick=()=>go(cur-1);
document.getElementById('nextBtn').onclick=()=>go(cur+1);

/* note modal (slide 4) */
const noteModal=document.getElementById('noteModal');
function openNote(){noteModal.classList.add('open');}
function closeNote(){noteModal.classList.remove('open');}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeNote();return;}
  if(noteModal.classList.contains('open')) return; // don't navigate while modal is open
  if(e.key==='ArrowRight'||e.key===' ') go(cur+1);
  if(e.key==='ArrowLeft') go(cur-1);
});
let tx=null;
deck.addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true});
deck.addEventListener('touchend',e=>{
  if(tx===null)return;
  const dx=e.changedTouches[0].clientX-tx;
  if(Math.abs(dx)>50) dx<0?go(cur+1):go(cur-1);
  tx=null;
},{passive:true});

/* count-up */
function animateCounts(slide){
  slide.querySelectorAll('.count').forEach(el=>{
    const target=+el.dataset.target;
    const dur=900;const t0=performance.now();
    function tick(t){
      const p=Math.min(1,(t-t0)/dur);
      const eased=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*eased);
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ============ charts (lazy) ============ */
const made={};
const C={yellow:'#fce776',yellowDeep:'#efb745',blue:'#5991d3',green:'#00b794',orange:'#ed7f54',amber:'#efb745',ink:'#212121',soft:'#6f6a68',grid:'#e8e5e3'};
Chart.defaults.font.family="'Antarctica VAR',sans-serif";
Chart.defaults.font.size=12;
Chart.defaults.color=C.soft;

function initChart(name){
  if(made[name])return;made[name]=true;
  if(name==='timeline'){
    const ns=[9,3,0,19,7,9,4];
    const amp=[
      'Amplitude: ~69k MAU — early NYC scale',
      'Amplitude: summer traffic dip (42k MAU in Jul), growth restarts Sept',
      'Amplitude: MAU 4x’d to ~210k, then 3x’d again by mid-2025',
      'Amplitude: auto-apply launches Jul ’25 · MAU crosses 1M in Sept',
      'Amplitude: holiday spike to 1.48M MAU · auto-apply opt-ins peak (6.1k/mo)',
      'Amplitude: MAU peaks at 1.61M · Job Card V2 rolls out Feb ’26',
      'Amplitude: SMS blasts + AMB rollout Apr–May · opt-outs spike in May'
    ];
    new Chart(document.getElementById('timelineChart'),{type:'line',
      data:{labels:['2024 Q2','2024 Q3','(no research)','2025 Q3','2025 Q4','2026 Q1','2026 Q2'],datasets:[
        {label:'Toward Bandana',data:[3.67,3.33,null,3.11,3.57,4.22,3.25],borderColor:C.yellowDeep,backgroundColor:C.yellow,pointBorderColor:C.ink,pointBorderWidth:1.5,pointRadius:5,pointHoverRadius:7,borderWidth:3,spanGaps:true,tension:.35},
        {label:'Toward the job market',data:[2.89,2.33,null,2.00,2.67,2.88,2.00],borderColor:C.blue,backgroundColor:C.blue,pointRadius:5,pointHoverRadius:7,borderWidth:3,borderDash:[6,5],spanGaps:true,tension:.35}
      ]},
      options:{maintainAspectRatio:false,plugins:{legend:{display:false},
        tooltip:{backgroundColor:'#212121',callbacks:{afterTitle:i=>'n = '+ns[i[0].dataIndex]+' interviews',label:i=>` ${i.dataset.label}: ${i.parsed.y?.toFixed(2)} / 5`,footer:i=>amp[i[0].dataIndex]||''},footerFont:{size:10.5,weight:'500'},footerColor:'#fce776'}},
        scales:{y:{min:1,max:5,ticks:{stepSize:1},grid:{color:C.grid}},x:{grid:{display:false},ticks:{maxRotation:0,autoSkip:false,font:{size:11}}}}}
    });
  }
  if(name==='growth'){
    const labels=['Apr 24','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan 25','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan 26','Feb','Mar','Apr','May'];
    const mau=[66.3,68.0,72.6,42.0,64.0,92.0,189.4,207.1,213.3,316.8,408.3,418.8,472.2,566.5,645.7,696.1,729.3,1080.8,1290.8,1028.8,1483.5,1608.0,1497.5,1517.9,1374.0,1439.2];
    const optins=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0.025,0.441,5.282,6.088,4.506,3.548,6.463,4.534,4.248,2.848,2.452];
    const marks=[{i:15,t:'Bandana Apply launches',lv:0},{i:22,t:'Job Card V2',lv:0},{i:24,t:'SMS rollout 100%',lv:1}];
    const markPlugin={id:'marks',afterDatasetsDraw(ch){
      const{ctx,chartArea:a,scales:{x}}=ch;ctx.save();
      const pillH=17,padH=7,gap=4;
      marks.forEach(m=>{
        const px=x.getPixelForValue(m.i);
        const pillTop=a.top+2+m.lv*(pillH+gap);
        // dashed guide line, starting below the deepest label row
        ctx.strokeStyle='rgba(33,33,33,.3)';ctx.setLineDash([5,4]);ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(px,pillTop+pillH);ctx.lineTo(px,a.bottom);ctx.stroke();
        // label pill, clamped inside the chart area
        ctx.setLineDash([]);ctx.font='600 10px Antarctica VAR';
        const w=ctx.measureText(m.t).width+padH*2;
        let bx=Math.min(Math.max(px-w/2,a.left+2),a.right-w-2);
        ctx.fillStyle='rgba(255,255,255,.95)';ctx.strokeStyle='rgba(33,33,33,.25)';ctx.lineWidth=1;
        ctx.beginPath();ctx.roundRect(bx,pillTop,w,pillH,8);ctx.fill();ctx.stroke();
        ctx.fillStyle='#212121';ctx.textAlign='left';ctx.textBaseline='middle';
        ctx.fillText(m.t,bx+padH,pillTop+pillH/2+.5);
      });
      ctx.restore();}};
    new Chart(document.getElementById('growthChart'),{type:'line',
      data:{labels,datasets:[
        {label:'Monthly active users (k)',data:mau,yAxisID:'y',borderColor:C.yellowDeep,backgroundColor:'rgba(252,231,118,.25)',fill:true,pointRadius:0,pointHoverRadius:5,borderWidth:3,tension:.18},
        {label:'Bandana Apply opt ins (k/mo)',data:optins,yAxisID:'y2',borderColor:C.green,backgroundColor:C.green,pointRadius:0,pointHoverRadius:5,borderWidth:2.5,borderDash:[6,5],tension:.18,spanGaps:false}
      ]},
      options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{legend:{display:false},
        tooltip:{backgroundColor:'#212121',callbacks:{label:i=>i.datasetIndex===0?` MAU: ${i.parsed.y>=1000?(i.parsed.y/1000).toFixed(2)+'M':Math.round(i.parsed.y)+'k'}`:` Bandana Apply opt ins: ${Math.round(i.parsed.y*1000).toLocaleString()}`}}},
        scales:{y:{position:'left',suggestedMax:2000,grid:{color:C.grid},ticks:{callback:v=>v>=1000?(v/1000)+'M':v+'k'}},
                y2:{position:'right',min:0,max:8,grid:{display:false},ticks:{callback:v=>v+'k'}},
                x:{grid:{display:false},ticks:{maxRotation:0,font:{size:10},autoSkip:true,maxTicksLimit:10}}}},
      plugins:[markPlugin]
    });
  }
  if(name==='themes'){
    const t=[['Pay transparency',7,0],['Resume / AI tools',7,-1],['Auto-apply',7,-2],['Map',9,-3],['UI / UX',12,-8],['Email recs',7,-8],['Search & filters',4,-11],['Job relevance',5,-11],['Stale & ghost jobs',2,-9],['Trust & safety',1,-9],['ATS / AI screening',1,-17],['Employer silence',0,-17]];
    new Chart(document.getElementById('themeChart'),{type:'bar',
      data:{labels:t.map(x=>x[0]),datasets:[
        {label:'Positive',data:t.map(x=>x[1]),backgroundColor:C.green,borderRadius:4,barPercentage:.72},
        {label:'Negative',data:t.map(x=>x[2]),backgroundColor:C.orange,borderRadius:4,barPercentage:.72}
      ]},
      options:{indexAxis:'y',maintainAspectRatio:false,plugins:{legend:{display:false},
        tooltip:{backgroundColor:'#212121',callbacks:{label:i=>` ${i.dataset.label}: ${Math.abs(i.parsed.x)}`}}},
        scales:{x:{stacked:true,grid:{color:C.grid},min:-18,max:14,ticks:{callback:v=>Math.abs(v)}},
                y:{stacked:true,grid:{display:false},ticks:{font:{size:11.5},color:C.ink}}}}
    });
  }
  if(name==='acq'){
    new Chart(document.getElementById('acqChart'),{type:'doughnut',
      data:{labels:['Instagram ads (8)','TikTok ads (3)','Word of mouth (3)','Other (7)'],
        datasets:[{data:[8,3,3,7],backgroundColor:[C.yellow,C.orange,C.green,'#d9d5d3'],borderColor:'#fff',borderWidth:3}]},
      options:{maintainAspectRatio:false,cutout:'62%',
        plugins:{legend:{position:'right',labels:{boxWidth:12,boxHeight:12,font:{size:12},color:C.ink}},
        tooltip:{backgroundColor:'#212121',callbacks:{label:i=>` ${i.parsed} of 21 users`}}}}
    });
  }
}

go(0);
