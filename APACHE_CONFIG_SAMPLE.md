# Sample Apache config

This requires the ProxyPass module **and** the RemoteIP module.  Please note I've not used apache in decades, so this is a best guess at a config.

```apache
NameVirtualHost example.net
<VirtualHost example.net>
   <Proxy http://127.0.0.1:3000/*>
      Allow from all
   </Proxy>
   <LocationMatch "/myapp">
      ProxyPass http://127.0.0.1:3000/
      ProxyPassReverse http://127.0.0.1:3000/ 
   </LocationMatch>
</VirtualHost>
```