var Mongo = require('mongodb'),
  ObjectId = Mongo.ObjectID,
  post = {
  "title" : "Let the Blogging Begin!",
  "link" : "http://melissaesplin.com/2007/10/hello-world/",
  "date" : "2007-10-29T04:26:33.000Z",
  "creator" : "melissa",
  "description" : "",
  "content" : "I'm just so excited that I could get MelissaEsplin.com! I can't wait to get blogging about projects, work, family, etc. Feel free to check out the additional pages of past/current work, read and/or comment on posts. Your ideas and input are appreciated. Thanks!Also you can check out the old blog <a href=\"http://www.untoldcircle.com/wordpress/\">HERE</a>. <img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.jpg\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.jpeg\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.gif\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.png\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.tiff\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.mp4\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.webm\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.ogg\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.ogv\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.mp3\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.ogg\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.opus\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.webm\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.aac\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.aiff\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.wav\"/><a href=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.txt\">txt</a><a href=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.pdf\">pdf</a><a href=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.zip\">zip</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test/test.html\">html</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test/test.htm\">html</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test/\">link</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test\">link</a>",
  "excerpt" : "<img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.jpg\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.jpeg\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.gif\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.png\"/><img src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.tiff\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.mp4\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.webm\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.ogg\"/><video src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.ogv\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.mp3\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.ogg\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.opus\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.webm\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.aac\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.aiff\"/><audio src=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.wav\"/><a href=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.txt\">txt</a><a href=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.pdf\">pdf</a><a href=\"http://assets.quiver.is/51e5a2ab725b54c7db000003/wp-content/uploads/quiver/test/test.zip\">zip</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test/test.html\">html</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test/test.htm\">html</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test/\">link</a><a href=\"http://images.melissaesplin.com/wp-content/uploads/quiver/test\">link</a>",
  "post_name" : "hello-world",
  "status" : "publish",
  "post_type" : "post",
  "category" : {
    "domain" : "category",
    "nicename" : "adventure",
    "value" : "adventure",
    "canonical" : "adventure"
  },
  "meta" : [
    {
      "meta_value" : "1",
      "meta_key" : "_edit_last",
      "canonical" : "_edit_last"
    },
    {
      "meta_value" : "no",
      "meta_key" : "aktt_notify_twitter",
      "canonical" : "aktt_notify_twitter"
    },
    {
      "meta_key" : "image",
      "canonical" : "image"
    }
  ],
  "comment" : [ ],
  "userID" : ObjectId("51e5a2ab725b54c7db000003")
}

module.exports = post;
