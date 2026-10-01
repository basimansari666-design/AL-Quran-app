import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, BookmarkCheck, ChevronRight, Moon, Search, Sun, Volume2, X } from "lucide-react";

const API = "https://api.alquran.cloud/v1";
const languages = { Urdu:"ur.jalandhry", English:"en.sahih", Turkish:"tr.diyanet", Spanish:"es.cortes", Hindi:"hi.hindi", Farsi:"fa.makarem" };
const reciters = {
  "Abdur Rahman As-Sudais":"ar.abdurrahmaansudais",
  "Mishary Rashid Alafasy":"ar.alafasy",
  "Maher Al-Muaiqly":"ar.mahermuaiqly",
  "Saad Al-Ghamdi":"ar.saadalghamidi",
  "Ahmed Al-Ajmi":"ar.ahmedajamy"
};

function App(){
  const [surahs,setSurahs]=useState([]), [selected,setSelected]=useState(null);
  const [translations,setTranslations]=useState([]), [audioAyahs,setAudioAyahs]=useState([]);
  const [language,setLanguage]=useState("Urdu"), [reciter,setReciter]=useState("Abdur Rahman As-Sudais");
  const [query,setQuery]=useState(""), [view,setView]=useState("home"), [loading,setLoading]=useState(false);
  const [dark,setDark]=useState(()=>localStorage.getItem("quran-theme")==="dark");
  const [bookmarks,setBookmarks]=useState(()=>JSON.parse(localStorage.getItem("quran-bookmarks")||"[]"));

  useEffect(()=>{ fetch(`${API}/surah`).then(r=>r.json()).then(d=>setSurahs(d.data||[])).catch(()=>{}); },[]);
  useEffect(()=>localStorage.setItem("quran-theme",dark?"dark":"light"),[dark]);
  useEffect(()=>localStorage.setItem("quran-bookmarks",JSON.stringify(bookmarks)),[bookmarks]);

  async function openSurah(number){
    setLoading(true); setView("reader");
    try{
      const [ar,tr,au]=await Promise.all([
        fetch(`${API}/surah/${number}/quran-uthmani`).then(r=>r.json()),
        fetch(`${API}/surah/${number}/${languages[language]}`).then(r=>r.json()),
        fetch(`${API}/surah/${number}/${reciters[reciter]}`).then(r=>r.json())
      ]);
      setSelected(ar.data); setTranslations(tr.data?.ayahs||[]); setAudioAyahs(au.data?.ayahs||[]);
      scrollTo({top:0,behavior:"smooth"});
    }catch{ alert("Quran data load nahi ho saka."); }
    finally{setLoading(false);}
  }
  async function changeLanguage(v){
    setLanguage(v); if(!selected)return;
    const d=await fetch(`${API}/surah/${selected.number}/${languages[v]}`).then(r=>r.json());
    setTranslations(d.data?.ayahs||[]);
  }
  async function changeReciter(v){
    setReciter(v); if(!selected)return;
    const d=await fetch(`${API}/surah/${selected.number}/${reciters[v]}`).then(r=>r.json());
    setAudioAyahs(d.data?.ayahs||[]);
  }
  function toggleBookmark(id){setBookmarks(b=>b.includes(id)?b.filter(x=>x!==id):[...b,id]);}
  const filtered=useMemo(()=>{const q=query.toLowerCase();return surahs.filter(s=>s.name.includes(query)||s.englishName.toLowerCase().includes(q)||String(s.number).includes(q));},[surahs,query]);

  return <div className={dark?"app dark":"app"}>
    <header className="navbar">
      <div className="brand" onClick={()=>{setView("home");setSelected(null)}}><div className="brandIcon"><BookOpen size={22}/></div><div><b>Al Quran</b><span>Kareem</span></div></div>
      <nav><button className={view==="home"?"active":""} onClick={()=>setView("home")}>Home</button><button className={view!=="home"?"active":""} onClick={()=>setView("quran")}>Quran</button></nav>
      <button className="theme" onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</button>
    </header>

    {view==="home"&&<main>
      <section className="hero"><div className="heroContent"><span>THE HOLY QURAN</span><h1>Read. Listen.<br/><strong>Reflect.</strong></h1><p>Connect with the words of Allah through a peaceful, modern Quran reading experience.</p><button className="primary" onClick={()=>setView("quran")}>Start Reading <ArrowRight size={18}/></button></div><div className="heroArabic">القرآن الكريم</div></section>
      <section className="container"><div className="heading"><div><small>EXPLORE</small><h2>Popular Surahs</h2></div><button className="link" onClick={()=>setView("quran")}>View all <ChevronRight size={17}/></button></div>
      <div className="grid">{surahs.filter(s=>[1,2,18,36,55,67].includes(s.number)).map(s=><SurahCard key={s.number} surah={s} onClick={()=>openSurah(s.number)}/>)}</div></section>
    </main>}

    {view==="quran"&&<main className="container page"><small>114 SURAHS</small><h1>Holy Quran</h1>
      <div className="search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Surah by name or number..."/>{query&&<button onClick={()=>setQuery("")}><X size={18}/></button>}</div>
      {filtered.map(s=><SurahCard large key={s.number} surah={s} onClick={()=>openSurah(s.number)}/>)}
    </main>}

    {view==="reader"&&<main className="reader">{loading?<div className="loading"><div className="loader"/><p>Loading Quran...</p></div>:selected&&<>
      <div className="container back"><button onClick={()=>setView("quran")}><ArrowLeft size={18}/> All Surahs</button></div>
      <section className="surahHead"><small>SURAH {selected.number}</small><h1>{selected.name}</h1><h2>{selected.englishName}</h2><p>{selected.numberOfAyahs} Ayahs · {selected.revelationType}</p>
        <div className="controls"><select value={language} onChange={e=>changeLanguage(e.target.value)}>{Object.keys(languages).map(x=><option key={x}>{x}</option>)}</select><select value={reciter} onChange={e=>changeReciter(e.target.value)}>{Object.keys(reciters).map(x=><option key={x}>{x}</option>)}</select></div>
      </section>
      <section className="ayahs">{selected.ayahs.map((a,i)=><article className="ayah" key={a.number}><div className="ayahTop"><span className="num">{a.numberInSurah}</span><div className="actions"><button onClick={()=>toggleBookmark(a.number)}>{bookmarks.includes(a.number)?<BookmarkCheck/>:<Bookmark/>}</button>{audioAyahs[i]?.audio&&<Volume2 size={20}/>}</div></div>
        <p className="arabic">{a.text}</p>{translations[i]&&<p className="translation">{translations[i].text}</p>}{audioAyahs[i]?.audio&&<audio controls src={audioAyahs[i].audio}/>}
      </article>)}
      <div className="nextprev">{selected.number>1&&<button onClick={()=>openSurah(selected.number-1)}><ArrowLeft/> Previous</button>}{selected.number<114&&<button onClick={()=>openSurah(selected.number+1)}>Next <ArrowRight/></button>}</div></section>
    </>}</main>}

    <footer><BookOpen size={20}/><b> Al Quran Kareem</b><p>Read · Listen · Reflect</p></footer>
  </div>
}

function SurahCard({surah,onClick,large}){return <button className={large?"card large":"card"} onClick={onClick}><span className="surahNum">{surah.number}</span><span className="cardInfo"><b>{surah.englishName}</b><small>{surah.englishNameTranslation} · {surah.numberOfAyahs} Ayahs</small></span><span className="arabicName">{surah.name}</span><ChevronRight className="arrow"/></button>}
export default App;