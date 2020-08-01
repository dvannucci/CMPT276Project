
const https=require('https');
$(document).ready(function () {

  let url = "https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=e9c4c6f3445b4bc9bdd19c823eb59ab7";

  $.ajax({
    url: url,
    method: "GET",
    dataType: "Json",

    beforeSend: function () {
      $(".progress").show();
    },

    complete: function () {
      $(".progress").hide();
    },
    success: function(news){
      let output="";
      let latestNews=news.articles;

      for(var i in latestNews){
        output+=`<div class="col l3 m6 s12">
          <div class="card medium hoverable">
            <div class="card-image">
              <img src="${latestNews[i].urlToImage}" class="responsive-img" >
              </div>
              <div class="card-content">
                <span class="card-title activator"><i class="material-icons right">more_vert</i></span>
                <h6 >${latestNews[i].title}</h6>

              </div>

              <div class="card-reveal">
                <span class="card-title"><i class="material-icons right">close</i></span>
                <p> ${latestNews[i].description}</p>
              </div>

              <div class="card-action">
                <a href="${latestNews[i].url}" target="_blank" class="btn">Read More</a>
              </div>
            </div>
           </div>
           `;

      }
      if(output!==""){
        $("#newsResults").html(ouput);
      }
    },

  error:function(){
    let errorMsg = `<div class="errorMsg center">Some error occured</div>`;
    $("#newsResults").html(errorMsg);
  }
  })
});
