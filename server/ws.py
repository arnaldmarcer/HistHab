from datetime import datetime
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import socket
import sys
import logging
import simplejson
import json
import os
import base64
import pandas as pd

users = {}
user = ""
json_file = os.path.dirname(os.path.abspath(__file__)) + "/../env/ws.json"

data = json.load(open(json_file))

root_dir = data.get("root_dir")
app_dir = root_dir + "/pophist/html"
data_dir = data.get("data_dir")
results_dir =  data.get("results_dir")
xls_pop_file = data.get("xls_pop_file")
xls_pop_sheet_name = data.get("xls_pop_sheet_name")
os.chdir(root_dir)

def dispatch_get(self, user):
    try:
        if(self.path.endswith(".txt")):
            f_name = app_dir + self.path
            f = open(f_name)
            self.send_response(200)
            self.send_header('Content-type','text/plain')
            self.end_headers()
            self.wfile.write(bytes(f.read()))
            f.close()
            return
        if(self.path.endswith(".css")):
            f_name = root_dir + self.path
            f = open(f_name)
            self.send_response(200)
            self.send_header('Content-type','text/css')
            self.end_headers()
            self.wfile.write(bytes(f.read()))
            f.close()
            return
        elif(self.path.endswith(".html")):
            session_info = user + " - " + self.client_address[0] + " - " + str(datetime.now()) + "\n"
            f_session = app_dir + '/../env/sessions.log'
            with open(f_session, 'a') as file:
                file.write(session_info)
            f_name = root_dir + self.path
            with open(f_name, 'r+') as fd:
                contents = fd.readlines()
                line_number = [i for i, s in enumerate(contents) if '</html>' in s]
                user_line = "<input type='hidden' id='user_name' value='" + user + "'>\n"
                contents.insert(line_number[0], user_line)
                ip_line = "<input type='hidden' id='user_ip' value='" + self.client_address[0] + "'>\n"
                contents.insert(line_number[0] + 1, ip_line)
                html = "".join(contents)

            self.send_response(200)
            self.send_header('Content-type','text/html')
            self.end_headers()
            self.wfile.write(bytes(html))
            return
        elif(self.path.endswith(".jpg")):
            f_name = ""
            if("land_cover_images" in self.path):
                f_name = root_dir + self.path
            else:
                f_name = data_dir + self.path.replace("ath_hist/data/", "")
            f = open(f_name, 'rb')
            self.send_response(200)
            self.send_header('Content-type','image/jpg')
            self.end_headers()
            self.wfile.write(f.read())
            f.close()
            return
        elif(self.path.endswith(".json")):
            f_name = None
            if("/data" in self.path):
                f_name = data_dir + self.path.replace("/ath_hist/data", "")
            elif("/results" in self.path):
                f_name = results_dir + self.path.replace("/ath_hist/results", "")
            elif("apps.json" in self.path):
                f_name = root_dir + self.path
            elif("config.json" in self.path):
                f_name = root_dir + self.path

            f = open(f_name, 'r')
            self.send_response(200)
            self.send_header('Content-type','application/json')
            self.end_headers()
            self.wfile.write(bytes(f.read()))
            f.close()
            return
        elif(self.path.endswith(".js")):
            f_name = root_dir + self.path
            f = open(f_name)
            self.send_response(200)
            self.send_header('Content-type','application/javascript')
            self.end_headers()
            self.wfile.write(bytes(f.read()))
            f.close()
            return
        elif("?" in self.path):
            s = root_dir + self.path
            region = s.split("?")[1].split("=")[1]
            directory = data_dir + "/orthos/" + region
            file_names = [fn for fn in os.listdir(directory)
                          if any(fn.endswith(ext) for ext in ['jpg', 'bmp', 'png', 'gif'])]
            s = "\n".join(file_names)
            xls = pd.ExcelFile(xls_pop_file)
            accessions = xls.parse(xls_pop_sheet_name)
            accessions["acronym"] = [entry.lower() for entry in accessions['acronym']]
            accessions = accessions[['acronym','name']]
            df = pd.DataFrame(file_names)
            df1 = pd.DataFrame([entry.split("_") for entry in df[0]])
            df1[5] = zip(*df1[4].map(lambda x: x.split('.')))[1]
            df = df1[[0,2,3,5]]
            df.columns = ["acronym", "year", "resolution", "extension"]
            df["resolution"] = [entry.replace("r", "") for entry in df['resolution']]
            df = df.sort_index(by=['acronym', 'year', 'resolution', 'extension'])
            df = pd.merge(df, accessions, left_on=['acronym'], right_on=['acronym'])
            df["resolution"] = [int(entry) for entry in df['resolution']]
            df = df.sort_index(by=['acronym', 'year', 'resolution']).drop_duplicates(['acronym', 'year'])
            json = "["
            for i in df.index.values:
                json = json + '{"acronym":"' + df['acronym'][i] + '",'
                json = json + '"year":"' + str(df['year'][i]) + '",'
                json = json + '"resolution":"' + str(df['resolution'][i]) + '",'
                json = json + '"extension":"' + df['extension'][i] + '",'
                json = json + '"name":"' + df['name'][i] + '"},'
            json = json[0:len(json)-1] + ']'
            json = json.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-type','application/json')
            self.end_headers()
            self.wfile.write(bytes(json))
            return

    except IOError:
        self.send_error(404,'File Not Found: %s' % self.path)

class AuthHandler(SimpleHTTPRequestHandler):
    ''' Main class to present webpages and authentication. '''
    def do_HEAD(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_AUTHHEAD(self):
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm=\"Test\"')
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        global users
        f_json = open(app_dir + "/../env/users.json")
        users = json.load(f_json)
        f_json.close()
        keys = []
        for user, pwd in users.items():
            keys.append('Basic ' + base64.b64encode(user + ":" + pwd))

        ''' Present frontpage with user authentication. '''
        if self.headers.getheader('Authorization') == None:
            self.do_AUTHHEAD()
            self.wfile.write('no auth header received')
            pass
        elif self.headers.getheader('Authorization') in keys:
            auth_str = self.headers.getheader('Authorization').split(" ")[1]
            user = base64.b64decode(auth_str)
            user = user.split(":")[0]
            dispatch_get(self, user)
            pass
        else:
            self.do_AUTHHEAD()
            self.wfile.write(self.headers.getheader('Authorization'))
            self.wfile.write('not authenticated')
            pass

    def do_POST(self):
        auth_str = self.headers.getheader('Authorization').split(" ")[1]
        user = base64.b64decode(auth_str)
        user = user.split(":")[0]

        content_len = int(self.headers.get('content-length', 0))
        post_body = self.rfile.read(content_len)
        data = simplejson.loads(post_body)

        # We can differentiate between the json data corresponding to the accuracy assessment and
        # the data entered for each population by checking whether the data is of type list (accuracy
        # assessment) or of type dict (population land cover data)
        if isinstance(data, list):
            f_name = results_dir + "/" + user + "_" + "accuracy_assessment_sample.json"
        else:
            f_name = results_dir + "/" + data['region'] + "/" + data['acronym'] + ".json"

        try:
            f = open(f_name, "w")
            simplejson.dump(data, f)
            f.close()
            self.send_response(200, 'Exit')
            self.end_headers()
            print("\nFILE SAVED: ==>" + f_name)
        except:
            self.send_response(400, 'Error')
            self.end_headers()
            print("FILE SAVING ERROR !")
        return

def run_ws(HandlerClass = AuthHandler,
         ServerClass = BaseHTTPServer.HTTPServer):
    BaseHTTPServer.test(HandlerClass, ServerClass)


if __name__ == '__main__':
    if len(sys.argv)<2:
        print "usage ws.py [port]"
        sys.exit()
    run_ws()
