(async function initMap() {
  const { StreetViewService } = await google.maps.importLibrary("streetView");
  const svService = new StreetViewService();

  let coordinates = {
      lat: 45.5147734,
      lng: -73.5851074,
  };
  let panoRequest = {
      radius: 25,
      location: coordinates,
      source: google.maps.StreetViewSource.OUTDOOR,
      preference: google.maps.StreetViewPreference.NEAREST,
  };
  findPanorama(svService, panoRequest, coordinates);
})();


async function findPanorama(svService, panoRequest, coordinates) {
  const { spherical } = await google.maps.importLibrary("geometry");
  const { StreetViewStatus, StreetViewPanorama } = await google.maps.importLibrary("streetView");

  // Send a request to the panorama service
  svService.getPanorama(panoRequest, function(panoData, status) {
    if (status === StreetViewStatus.OK) 
    {
      console.debug(`Status ${status}: panorama found.`);
      
      const heading = spherical.computeHeading(panoData.location.latLng, coordinates);
      const panoId = panoData.location.pano;

      const sv = new StreetViewPanorama(
        document.getElementById('streetview'),
        {
            position: coordinates,
            center: coordinates,
            zoom: 0,
            pov: {
              pitch: 0,
              heading: heading,
            },
        });
      sv.setPano(panoId);
    }
    else {
      var radius = panoRequest.radius
      //Handle other statuses here
      if (radius >= 100) {
        console.log(`Status ${status}: Could not find panorama within ${radius}m! Giving up.`);
        alert('ERROR');
      }
      else {
        panoRequest.radius += 25;
        console.log(`Status ${status}: could not find panorama within ${radius}m, trying ${panoRequest.radius}m.`);
        return findPanorama(svService, panoRequest, coordinates);
      }
    }
  });
}


async function screenshot(element_id) {
  return html2canvas(
      document.getElementById(element_id), {
          useCORS: true,
          logging: false, // set true for debug,
          ignoreElements: el => 
          // The following hides unwanted controls, copyrights, pins etc. on the maps and streetview canvases
          el.classList.contains("gmnoprint") || el.classList.contains("gm-style-cc") 
          || el.id === 'gmimap1' || el.tagName === 'BUTTON' || el.classList.contains("gm-iv-address")
          || el.id === 'time-travel-container' // If you followed my previous tutorial
          || el.getAttribute('src') === 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi3_hdpi.png' // pins
          || el.getAttribute('src') === 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi3.png' // pins
          || el.getAttribute('aria-label') === 'Open this area in Google Maps (opens a new window)'
      }
  ).then(canvas => {
      // Adds the screenshots to the page
      document.body.style.overflowY = 'scroll';
      document.body.style.height = '100%';
      document.getElementById('test-screenshot-container').prepend(canvas);
      
      // Convert to data URL for saving or uploading
      const dataURL = canvas.toDataURL("image/jpeg");

      // Download the screenshot locally
      var a = document.createElement('a');
      a.href = dataURL;
      a.download = `screenshot_${Date.now()}.jpg`;
      a.click();
      
      return dataURL;
  })
}


async function screenshotStreetview(event) {
  event.preventDefault();

  const postData = {
      img: await screenshot('streetview'),
  }

  // Change this to upload the image to your server
  const uploadURL = "/test"
  fetch(uploadURL, {
      method: "POST",
      mode: "same-origin", 
      cache: "no-cache", 
      credentials: "same-origin", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
  }).catch(() => {
      console.debug('Set a server URL to upload the image')
  });
}


