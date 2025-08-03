# Code	Meaning
# 401   Unauthorized
# 404 	File or folder not found
# 403   Forbidden (e.g. permissions)
# 405   Method not allowed
# 409   Conflict (e.g. parent folder missing)
# 423   Locked

root='https://backspaces.net/echo-server'   # cPanel

root='https://webdav-server.glitch.me'      # Glitch
root='https://backspaces.net/webdav-one/'    # cPanel
root='https://backspaces.net/webdav-two/'    # cPanel
root='https://webdav-server.deno.dev'       # Deno Deploy
root='http://3.137.171.107:8888'            # Deno CLI AWS
root='http://localhost:8888'                # Deno CLI desktop

usr='-u demo:secret'
usr='-u bob:builder'
usr='-u alice:wonderland'

echo $root $usr

curl -X PROPFIND $root # fails, no usr/auth
curl $usr -X PROPFIND $root
curl -s $usr -X PROPFIND $root | grep href # -s supress progress meter
curl -s $usr -X PROPFIND $root/hello | grep href

curl $usr -X PUT $root/hello.txt -d 'Hi from Curl!'
curl $usr -X GET $root/hello.txt
curl $usr -X DELETE $root/hello.txt
curl $usr -X PUT $root/hello.txt -d 'Hi!'
curl $usr -X GET $root/hello.txt
curl $usr -X PUT $root/hello/hello.txt -d 'Hi again!'
curl $usr -X GET $root/hello/hello.txt

curl -s $usr -X PROPFIND $root | grep href
curl $usr -i -X OPTIONS $root

curl $usr -X PUT $root/hello.txt -d 'Hi from Curl!'
curl $usr -X GET $root/hello.txt
curl $usr -X DELETE $root/hello.txt

curl $usr -X PUT $root/delete.txt -d 'Delete me!'
curl $usr -X GET $root/delete.txt
curl $usr -X DELETE $root/delete.txt
curl $usr -X GET $root/delete.txt

curl $usr -X MKCOL $root/folder/
curl $usr -X PUT $root/folder/foo.txt -d 'I am in folder'
curl $usr -X GET $root/folder/foo.txt

curl $usr -X PUT $root/copy.txt -d 'I will get copied!'
curl $usr -X GET $root/copy.txt
curl $usr -X COPY $root/copy.txt -H "Destination: $root/copyed.txt"
curl $usr -X GET $root/copyed.txt

curl $usr -X PUT $root/move.txt -d 'I will be moving!'
curl $usr -X GET $root/move.txt
curl $usr -X MOVE $root/move.txt -H "Destination: $root/moved.txt"
curl $usr -X GET $root/moved.txt

# =========

curl -s -X PROPFIND $root -H 'Depth: 1' | xmllint --format - | grep D:href

curl -X PROPFIND $root
curl -s -X PROPFIND $root | grep href
curl -s -X PROPFIND $root -H 'Depth: 1' | sed 's/</\'$'\n''</g' | grep '<D:href>'
curl -s -X PROPFIND $root -H 'Depth: 1' | sed '
s/</\
</g
' | grep '<D:href>'

curl -X PROPFIND $root -H 'Depth: 1'
curl -s -X PROPFIND $root -H 'Depth: 1' | grep href
curl -s -X PROPFIND $root -H 'Depth: 1' | xmllint --format - | grep D:href

curl -i -X OPTIONS $root   \
  -H "Access-Control-Request-Method: GET"
curl -i -X OPTIONS $root   \
  -H "Origin: http://localhost:9000" \
  -H "Access-Control-Request-Method: GET"

curl -X RESET -i $root/
curl -s -X PROPFIND $root -H 'Depth: 1' | xmlstarlet sel -N d="DAV:" -t -m "//d:response/d:href" -v "." -n
curl -X MKCOL $root/folder/
curl -s -X PROPFIND $root -H 'Depth: 1' | xmlstarlet sel -N d="DAV:" -t -m "//d:response/d:href" -v "." -n

curl -X RESET -i $root/
curl -X MKCOL $root/folder/
curl -s -X PROPFIND $root -H 'Depth: 1' | xmlstarlet sel -N d="DAV:" -t -m "//d:response/d:href" -v "." -n

PROPFIND_XML=$(curl -s -X PROPFIND $root -H 'Depth: 1')
echo "$PROPFIND_XML" | xmlstarlet sel -N d="DAV:" -t -m "//d:response/d:href" -v "." -n

curl -s -X PROPFIND $root -H 'Depth: 1' | xmlstarlet sel -N d="DAV:" -t -m "//d:response/d:href" -v "." -n


curl -X PUT $root/lockme.txt -d 'Lock Me!'
LOCK_RESPONSE=$(curl -X LOCK "$root/lockme.txt" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?>
<D:lockinfo xmlns:D="DAV:">
  <D:lockscope><D:exclusive/></D:lockscope>
  <D:locktype><D:write/></D:locktype>
  <D:owner>
    <D:href>mailto:you@example.com</D:href>
  </D:owner>
</D:lockinfo>')

LOCK_TOKEN=$(echo "$LOCK_RESPONSE" | grep -i "Lock-Token" | awk '{print $2}' | tr -d '\r')

curl -X UNLOCK $root/lockme.txt \
  -H "Lock-Token: $LOCK_TOKEN"

curl -X RESET -i $root/

