# Interactive Team GB Gallery

Interactive Team GB Gallery. Using interactive template. 



Composer: 
https://composer.gutools.co.uk/content/5784dd57e4b0630007c6ba91

Google Doc: 
https://docs.google.com/document/d/1nDXpsJ5Tf2JF5CfCxL-7vZRpq1OM04tG-09Owyh4bHU/edit

Repo: 
https://github.com/guardian/interactive-team-gb-gallery


## Getting started
If you haven't already installed [nodejs](http://nodejs.org/download/)
and [grunt-cli](http://gruntjs.com/getting-started), go do that first.

Fork the project over on github then clone your new fork.

```bash
> git clone git@github.com:guardian/my-new-project.git
> cd my-new-project
> npm install
> bower install
> grunt
```

You can now view the example project running at http://localhost:9000/


## Deploying to S3

Once you ready to to play to S3 you can use grunt to upload your files.

First you'll need to specify where the files are to be uploaded to. This
is done in the `package.json` file (note: this is probably not the best
place to store that information, it might change in the future).

In the `package.json` there is a section for `config` which contains
the paths that the deploy task will upload to. Change these paths to
whatever you need them to be.

```json
  "config": {
    "port": 9000,
    "s3_folder": "embed/testing/path/",
    "cdn_url": "http://interactive.guim.co.uk/embed/testing/path/"
  },
```

Next you'll want to simulate the upload to ensure it's going to do what
you think it will.
```bash
> grunt deploy --test
```

Once you're happy everything looks good, deploy for real.
```bash
> grunt deploy
```

http://jsfiddle.net/cgspicer/V4qh9/
