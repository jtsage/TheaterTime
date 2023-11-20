# TheaterTime

This is a simple timer for theater events

## FAQ

### Is this secure?

Probably not, no.  Please do not add any sensitive data

### Can I retrieve a lost password?

Nope. Create a new timer. And remember to export the data from it for reuse too.

### Where did my event go?

Events with no unfinished timers are purged 1 week after creation. All other events are purged one month after creation.

### Can you add XXX?

Maybe.  Head over to the <a href="https://github.com/jtsage/TheaterTime">GitHub</a> and open an issue and I'll take a look.

### Can I privately host this?

Sure.  It should also work fine on closed networks.  Grab the source from GitHub, there are docs there too

### Does this cost anything?

Nope. The source is open too, see the GitHub

### Is your copy reliable?

Probably. It is on a production server, I plan on using it for my own productions, so it will likely be continually functional.  However, if your use case can sustain no down time at all, it might be better to run your own copy.

### How do I run my own copy?

Download the source. You'll need a system with node (18+ probably), and yarn on it.

Install dependencies

` # yarn `

Run the server

` # npm start`

The app is now running on http://localhost:3000/ - setting a proxy connection is the preferred method, but you can edit `backend/index.js` and set the app to listen on a different (or all) interface(s), and change the port if you desire.

Someday, I might make a docker instance for this, but it's been a while, and I don't really remember how to do so - if anyone wants to set that up and push a PR, I'd be happy to accept it.

## LICENSE

This is covered under the ISC license - simply put, do whatever you want with it, but it's not my fault if it breaks your stuff.

## PULL REQUESTS

I am happy to accept pull requests with new features or whatever. Squashed commits are nice, but not an absolute requirement.