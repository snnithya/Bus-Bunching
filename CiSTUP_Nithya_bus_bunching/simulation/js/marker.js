function readTextFile(file)
{
  /*
  Function that reads gps and time data
  */
  //var data;
  return new Promise(function(resolve, reject)
  {
      var data;
      var rawFile = new XMLHttpRequest();
      rawFile.open("GET", file, true);
      rawFile.onreadystatechange = function()
        {
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status == 0)
                {
                    var allText = rawFile.response;
                    var data = Papa.parse(allText, {header: true});
                    resolve(data);
                }
            }
        }
      rawFile.send(null);
    });
}

readTextFile("http://localhost:8000/Documents/IISC/data/150812728_gps_map.csv").then(function(data){console.log(data);}, function(data){console.log('failed');});
