export default function About() {
  return (
<div className="about-page">
  <meta charSet="utf-8" />
  <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
  <title>About</title>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://use.typekit.net/upz7xsh.css" />
  <link rel="stylesheet" href="assets/css/index.css" />
  <link rel="dns-prefetch" href="https://shadertoy.com" />
  <meta name="description" content="A VR and AR project that helps explain chronic disease through an immersive exhibition experience." />
  <meta name="twitter:description" content="A VR and AR project that helps explain chronic disease through an immersive exhibition experience." />
  <meta property="og:description" content="A VR and AR project that helps explain chronic disease through an immersive exhibition experience." />
  <meta name="twitter:title" content="About" />
  <meta property="og:site_name" content="About" />
  <meta property="og:title" content="About" />
  <meta name="twitter:site" content="@vessels" />
  <meta name="twitter:creator" content="@vessels" />
  <meta name="twitter:url" content="https://cineshader.com" />
  <meta property="og:url" content="https://cineshader.com" />
  <meta property="og:image" content="https://cineshader.com/assets/images/share.png" />
  <meta name="twitter:image" content="https://cineshader.com/assets/images/share.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="apple-touch-icon" sizes="57x57" href="assets/images/apple-icon-57x57.png" />
  <link rel="apple-touch-icon" sizes="60x60" href="assets/images/apple-icon-60x60.png" />
  <link rel="apple-touch-icon" sizes="72x72" href="assets/images/apple-icon-72x72.png" />
  <link rel="apple-touch-icon" sizes="76x76" href="assets/images/apple-icon-76x76.png" />
  <link rel="apple-touch-icon" sizes="114x114" href="assets/images/apple-icon-114x114.png" />
  <link rel="apple-touch-icon" sizes="120x120" href="assets/images/apple-icon-120x120.png" />
  <link rel="apple-touch-icon" sizes="144x144" href="assets/images/apple-icon-144x144.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="assets/images/apple-icon-152x152.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="assets/images/apple-icon-180x180.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="assets/images/android-icon-192x192.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="96x96" href="assets/images/favicon-96x96.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16x16.png" />
  <link rel="manifest" href="assets/images/manifest.json" />
  <meta name="msapplication-TileColor" content="#ffffff" />
  <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
  <meta name="theme-color" content="#ffffff" />
  <div id="app">
    <header className="header">
      <nav className="header__menu">
        <a href="#" target="_blank">
          <div className="header__menu_item--lab">
            <span className="header__menu_lab_text">About</span>
          </div>
        </a>
        <ul className="menu__items">
          <li className="menu__item">
            <button className="menu__audio" aria-label="Toggle Audio" />
          </li>
          <li className="menu__item menu__item--is-separator"><span>|</span></li>
          <li className="menu__item">
            <a href="/" className="menu__link" rel="internal">Home</a>
          </li>
          <li className="menu__item menu__item--is-gallery">
            <button
              type="button"
              className="menu__link"
              onClick={() => window.location.assign('/gallery')}
              style={{ background: 'none', border: 0, padding: 0 }}
            >
              Gallery
            </button>
          </li>
          <li className="menu__item menu__item--is-exhibition">
            <button
              type="button"
              className="menu__link"
              onClick={() => window.location.assign('/exhibition')}
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
            >
              Exhibition
            </button>
          </li>
          <li className="menu__item">
            <a href="/about" className="menu__link" rel="internal">About</a>
          </li>
        </ul>
      </nav>
    </header>
    <canvas id="main-canvas" />
    <div id="shader-context">
      <h4 id="shader-title" />
      <div id="shader-desc" />
    </div>
    <div className="view-infos">
      <h4 className="view-infos__title" />
      <div className="view-infos__subtitle">
        by
        <a href="https://www.shadertoy.com/user/" target="_blank" className="button-inline view-infos__author" />
      </div>
      <p className="view-infos__description" />
      <div className="view-infos__buttons">
        <a href="https://www.shadertoy.com/view/" target="blank" className="button-default view-infos__link">Open in Shadertoy</a>
        <div className="view-infos__fork">
          <div className="select-wrapper">
            <select className="select-default view-infos__select" title="Choose the editor's tab where this sketch will be copied">
              <option value={1} selected>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <button className="button-default view-infos__fork-button" aria-label="Edit">
            Edit
          </button>
        </div>
        <button className="button-default view-infos__back">
          Back to editor
        </button>
      </div>
    </div>
    <div className="gallery">
      <div className="gallery__wrapper">
        <header className="gallery__header">
          <p className="gallery__subtitle">
            Discover the CineShaders created by the
            <a className="button-inline title-text-effect__non-text" href="https://www.shadertoy.com" target="_blank">Shadertoy</a>
            community.<br />Click on any to preview it in the 3D
            environment.<br />If you want to add yours, please
            <button className="button-inline about-prompt-button title-text-effect__non-text" data-id="save-and-share" aria-label="Open the save and share instructions">
              follow these instructions</button>.
          </p>
          <div className="gallery__controls">
            <span className="gallery__controls-text">Sort by:</span>
            <div className="select-wrapper select-wrapper--gallery">
              <select className="select-default gallery__select" title="Select the Shadertoy sorting method">
                <option value="popular" selected>Popular</option>
                <option value="newest">Newest</option>
                <option value="hot">Hot</option>
                <option value="name">Name</option>
                <option value="love">Love</option>
              </select>
            </div>
          </div>
        </header>
        <main className="gallery__inner" />
      </div>
    </div>
    <div className="about">
      <div className="about__wrapper">
        <div className="about__inner">
          <div className="about__infos">
            <div className="about__categories">
              <div className="about__category">
                <h5 className="category__title">Credits</h5>
                <div className="category__text">
                  Lorik Jashari<br />
                  Diel Govori<br />
                  Ylber Govori<br />
                  Bardh Hasani<br />
                  Abdullah Murati
                </div>
              </div>
              <div className="about__category">
                <div className="about__category-separator" />
                <h5 className="category__title">About this project</h5>
                <div className="category__text">
                  This project is based on VR and AR, and it is designed to help
                  people understand chronic disease through an immersive,
                  human-centered experience.
                  <br /><br />
                  The 3D presentation makes the subject easier to explore,
                  easier to remember, and easier to discuss.
                </div>
              </div>
              <div className="about__category">
                <div className="about__category-separator" />
                <h5 className="category__title">Terms</h5>
                <p className="category__text">
                  We are not responsible for the content the user created. All
                  user generated shaders are hosted on Shadertoy.com and for
                  the ownership/license of the shaders, please refer to
                  <a className="button-inline title-text-effect__non-text" href="https://www.shadertoy.com/terms" target="_blank">https://www.shadertoy.com/terms</a>
                </p>
              </div>
            </div>
          </div>
          <div className="about__intro">
              This project uses VR and AR to explain chronic disease through
              an immersive exhibition.
              <br className="title-text-effect__non-text" /><br className="title-text-effect__non-text" />
              The goal is to make the subject clearer, more human, and easier
              to discuss by turning it into a visual experience.
              still hosted at Shadertoy.com and reverse compatible in
              Shadertoy.
              <hr className="about-about-separator title-text-effect__non-text" />
              <div className="about-company-title title-text-effect__non-text">
              The project is designed as a public-facing experience where
              people can explore health topics in a calm, accessible way.
              more approachable through immersion.
              <hr className="about-about-separator title-text-effect__non-text" />
              <div className="about-company-title title-text-effect__non-text">
                Follow Us
              </div>
              <span className="about-social button-inline title-text-effect__non-text">www</span>
              |
              <span className="about-social button-inline title-text-effect__non-text">tw</span>
              |
              <span className="about-social button-inline title-text-effect__non-text">in</span>
              |
              <span className="about-social button-inline title-text-effect__non-text">ig</span>
              |
              <span className="about-social button-inline title-text-effect__non-text">fb</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="editor">
      <div className="editor__inner">
        <div className="editor__nav-modes">
          <div className="editor__nav-mode-wrapper">
            <input id="editor__nav-mode--narrow" className="editor__nav-mode" type="radio" name="nav-mode" defaultValue="narrow" defaultChecked /><label className="editor__nav-mode-label" htmlFor="editor__nav-mode--narrow">Static</label>
          </div>
          <div className="editor__nav-mode-wrapper">
            <input id="editor__nav-mode--free" className="editor__nav-mode" type="radio" name="nav-mode" defaultValue="free" /><label className="editor__nav-mode-label" htmlFor="editor__nav-mode--free">Free nav</label>
          </div>
        </div>
        <div className="editor__intro">
          <div className="editor__intro-header">
            <h2 className="editor__intro-title">Shader editor</h2>
            <button className="button-icon editor__intro--minimize" title="Hide Instruction" />
          </div>
          <div className="editor__intro-description">
            Welcome to your personal shader playground, where you can write
            your own and see how it looks in a cinematic 3D environment.
            <br /><br />
            Few things to know:<br />
            <ul>
              <li>
                The shader editing structure matches the same as the one in
                Shadertoy.com with the same predefined uniforms such as
                iResolution, iTime, etc. Except no texture, audio and
                framebuffer supported
              </li>
              <li>
                There are other features including 2.5D through the alpha
                channel of fragColor.
                <button className="button-inline button__instructions" data-id="more-features" aria-label="more features">
                  See here for more details
                </button>
              </li>
              <li>
                We don’t host your shaders, your shaders are automatically
                saved in your local machine through the localStorage API. You
                got 3 shader slots for localStorage. If you want to save and
                share your CineShader, please
                <button className="button-inline button__instructions" data-id="save-and-share" aria-label="Open the save and share instructions">
                  follow these instructions
                </button>
              </li>
              <li>
                WebGL 2 by default and WebGL 1 fallback if the user’s browser
                doesn’t support WebGL 2
              </li>
              <li>
                Need a reminder of the supported uniforms?
                <button className="button-inline button__instructions" data-id="shader-syntax" aria-label="Shader syntax">
                  Here you go
                </button>
              </li>
              <li>
                If you want to convert your existing shaders from Shadertoy
                into a compatible shader,
                <button className="button-inline button__instructions" data-id="convert-your-shader" aria-label="Convert your shader">
                  see here
                </button>
              </li>
              <li>
                Open your shadertoy in CineShader:
                <button className="button-default button__instructions" data-id="test-shadertoy" aria-label="test-shadertoy">
                  ENTER HERE
                </button>
              </li>
            </ul>
            <br />
            We encourage you to add the
            <a className="button-inline" href="https://www.shadertoy.com/results?query=tag%3Dcineshader" target="_blank">cineshader</a>
            tag if you save your shaders on Shadertoy.
          </div>
        </div>
        <div className="editor__main">
          <ul className="editor__tabs">
            <li className="editor__tab is-active" title="Slot 1">1</li>
            <li className="editor__tab" title="Slot 2">2</li>
            <li className="editor__tab" title="Slot 3">3</li>
          </ul>
          <div className="editor__buttons">
            <div className="editor__buttons-line">
              <div className="group group--template">
                <span className="group__name">Template:</span>
                <div className="select-wrapper">
                  <select className="select-default" />
                </div>
                <button className="button-default button__load" aria-label="Load template">
                  New
                </button>
              </div>
              <div className="group group--model">
                <span className="group__name">Model:</span>
                <div className="select-wrapper">
                  <select className="select-default">
                    <option value="person">Person</option>
                    <option value="car">Car</option>
                    <option value="nothing">Nothing</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="editor__buttons-line">
              <div className="group group--title">
                <span className="group__name">Title:</span>
                <input className="group__input-text" type="text" defaultValue="My Shader" />
              </div>
              <div className="group group--description">
                <span className="group__name">Description:</span>
                <input className="group__input-text" type="text" defaultValue="Lorem ipsum dolor" />
              </div>
            </div>
          </div>
          <div id="shader-editor">
            <div id="shader-editor-cm" />
            <div className="editor__controls">
              <div className="editor__controls-left">
                <button className="button-default button__preview" aria-label="Preview shader">
                  Preview
                </button>
                <span className="button-separator" />
                <button className="button-default button__compile" aria-label="Compile shader" title="Alt + Enter">
                  Compile
                </button>
                <button className="button-icon button__restart" aria-label="Restart shader time" title="Alt + Down">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16.9 26" xmlSpace="preserve">
                    <path d="M16.9 0v26L4.5 13 16.9 0M0 0h4.5v26H0z" />
                  </svg>
                </button>
                <button className="button-icon button__pause" aria-label="Pause shader" title="Alt + Up">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x={0} y={0} viewBox="0 0 12.4 26" xmlSpace="preserve">
                    <path className="play" d="M0 26V0l12.4 13L0 26" />
                    <path className="pause" d="M0 0h4.5v26H0zM7.9 0h4.5v26H7.9z" />
                  </svg>
                </button>
              </div>
              <div className="editor__controls-right">
                <span className="time">164.7</span>
                <span className="fps"> <span className="fps-value">59</span>fps</span>
                <span className="button-separator" />
                <button className="button-icon button__screenshot" aria-label="Screenshot" title="HD snapshot">
                  <svg version="1.1" viewBox="0 0 16 16" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
                    <path d="m4.8 9c0 1.8 1.5 3.3 3.3 3.3s3.3-1.5 3.3-3.3-1.6-3.2-3.4-3.2-3.2 1.4-3.2 3.2zm10.2-5.5h-3.5c-0.3-1-0.5-2-1.5-2h-4c-1 0-1.3 1-1.5 2h-3.5c-0.6 0-1 0.4-1 1v9c0 0.6 0.4 1 1 1h14c0.6 0 1-0.4 1-1v-9c0-0.6-0.4-1-1-1zm-7 9.9c-2.5 0-4.4-2-4.4-4.4s2-4.4 4.4-4.4c2.5 0 4.4 2 4.4 4.4s-1.9 4.4-4.4 4.4zm7-6.9h-2v-1h2v1z" />
                  </svg>
                </button>
                <span className="button-separator" />
                <div className="editor__controls-view-quality select-wrapper">
                  <select className="select-default select-quality" title="View Quality">
                    <option value={0}>Minimal</option>
                    <option value={1}>Low</option>
                    <option value={2}>Mid (Interlace)</option>
                    <option value={3}>Full</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="prompt">
      <div id="prompt--bg" />
      <div id="prompt--box">
        <div id="prompt--msg">Error message here!</div>
        <input type="text" id="prompt--input" />
        <button id="prompt--ok-btn" className="button-default prompt--button prompt--button__is-ok" aria-label="Ok">
          OK
        </button>
      </div>
    </div>
    <div id="preloader-vr">
      <h2 id="preloader-vr__title">Entering CineShader VR</h2>
      <p id="preloader-vr__progress">
        Now Loading (<span id="preloader-vr__progress__percent" />%)
      </p>
    </div>
    <div className="xr-landing">
      <div className="xr-landing__bg" />
      <h3 className="xr-landing__title">A shared space for care</h3>
      <p className="xr-landing__desc">
        An exhibition shaped with Swiss TPH, IHS, SDC, and the Government of Kosovo.<br />
        It brings lived experience, research, and care into one shared space.<br />
        Step inside and move through stories of resilience, dignity, and connection.
      </p>
      <button className="button-default button__webxr button__webxr--middle" aria-label="ENTER VR">
        ENTER VR
      </button>
      <span className="xr-landing__craftedby">About</span>
    </div>
  </div>
  <div className="button-wrapper__webxr--corner">
    <button className="button-default button__webxr button__webxr--corner" aria-label="Enter VR">
      Enter VR
    </button>
  </div>
</div>
  )
}