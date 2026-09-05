import os,sys,tempfile,secrets,unittest
from pathlib import Path
from unittest.mock import patch
TEST_ROOT=Path(tempfile.mkdtemp(prefix="maths-remediation-"));os.chmod(TEST_ROOT,0o700)
os.environ.update(APP_ENV="production",TESTING="0",AUTO_BOOTSTRAP="0",SERVE_STATIC="false",DATABASE_URL="sqlite:///"+str(TEST_ROOT/"fixture.db"),CONTENT_ROOT=str(TEST_ROOT),SECRET_KEY=secrets.token_hex(32),ALLOW_UNAUTHENTICATED_DEV="0")
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from fastapi.testclient import TestClient
from app.main import app
from app import db,orm,security
from app.routers import compat,auth
app.state.limiter.enabled=False;compat.limiter.enabled=False;auth.limiter.enabled=False
class Remediation(unittest.TestCase):
 def setUp(self):
  db.Base.metadata.create_all(bind=db.engine)
  self.password=secrets.token_urlsafe(18)
  with db.SessionLocal() as s:
   u=orm.User(email=secrets.token_hex(8)+"@example.invalid",full_name="Synthetic fixture",role="student",is_active=False,hashed_password=security.get_password_hash(self.password));s.add(u);s.commit();self.uid=u.id;self.email=u.email;self.original_hash=u.hashed_password
  self.context=TestClient(app,base_url="https://testserver");self.client=self.context.__enter__()
 def tearDown(self):self.context.__exit__(None,None,None)
 def bearer(self):return {"Authorization":"Bearer "+security.create_access_token({"sub":str(self.uid)})}
 def test_inactive_login_rejected(self):
  self.assertIn(self.client.post("/api/v1/login-form",data={"email":self.email,"password":self.password}).status_code,[400,401])
 def test_inactive_session_rejected(self):self.assertEqual(self.client.get("/api/v1/session",headers=self.bearer()).status_code,401)
 def test_inactive_password_unchanged(self):
  self.assertEqual(self.client.post("/api/v1/change-password",headers=self.bearer(),json={"new_password":"SyntheticReplacement123!"}).status_code,401)
  with db.SessionLocal() as s:self.assertEqual(s.get(orm.User,self.uid).hashed_password,self.original_hash)
 def test_active_login_secure_cookie(self):
  with db.SessionLocal() as s:u=s.get(orm.User,self.uid);u.is_active=True;s.commit()
  r=self.client.post("/api/v1/login-form",data={"email":self.email,"password":self.password});self.assertEqual(r.status_code,200);self.assertTrue("Secure" in r.headers["set-cookie"],"production cookie must be Secure")
 def test_health_database_check(self):
  self.assertEqual(self.client.get("/api/health").status_code,200)
  with patch.object(db.engine,"connect",side_effect=RuntimeError("private sentinel")):
   r=self.client.get("/api/health");self.assertEqual(r.status_code,503);self.assertNotIn("private sentinel",r.text)
  self.assertEqual(self.client.get("/api/v1/ping").status_code,200)
 def test_startup_database_failure_stops(self):
  with patch.object(db.Base.metadata,"create_all",side_effect=RuntimeError("synthetic db failure")):
   with self.assertRaises(RuntimeError):
    with TestClient(app):pass
 def test_active_session_and_password_flow(self):
  with db.SessionLocal() as s:u=s.get(orm.User,self.uid);u.is_active=True;s.commit()
  self.assertEqual(self.client.get("/api/v1/session",headers=self.bearer()).status_code,200)
  r=self.client.post("/api/v1/change-password",headers=self.bearer(),json={"new_password":"SyntheticReplacement123!"});self.assertEqual(r.status_code,200)
  with db.SessionLocal() as s:self.assertTrue(security.verify_password("SyntheticReplacement123!",s.get(orm.User,self.uid).hashed_password))
 def test_active_json_login_secure_cookie(self):
  with db.SessionLocal() as s:u=s.get(orm.User,self.uid);u.is_active=True;s.commit()
  r=self.client.post("/api/v1/login",json={"email":self.email,"password":self.password});self.assertEqual(r.status_code,200);self.assertTrue("Secure" in r.headers["set-cookie"],"production cookie must be Secure")
 def test_tree_and_traversal(self):
  folder=TEST_ROOT/"public-fixture";folder.mkdir(exist_ok=True);(folder/"lesson.html").write_text("<title>Synthetic lesson</title>")
  from app.main import get_full_tree_cached
  get_full_tree_cached.cache_clear()
  r=self.client.get("/api/tree/public-fixture");self.assertEqual(r.status_code,200);self.assertEqual(r.json()["children"][0]["url"],"/content/public-fixture/lesson.html")
  self.assertEqual(self.client.get("/api/tree/%2e%2e%2foutside").status_code,400)
  self.assertEqual(self.client.get("/api/tree/not-existing-fixture").status_code,404)
 def test_container_health_uses_database(self):
  dockerfile=(Path(__file__).resolve().parents[2]/"Dockerfile").read_text()
  self.assertTrue("127.0.0.1:8000/api/health" in dockerfile,"container health must check database")
 def test_tree_error_has_no_private_path(self):
  with patch("app.main.get_full_tree_cached",side_effect=RuntimeError("private sentinel /local/path")):
   r=self.client.get("/api/tree");self.assertEqual(r.status_code,500);self.assertNotIn("private sentinel",r.text)
 def test_active_multipart_login(self):
  with db.SessionLocal() as s:u=s.get(orm.User,self.uid);u.is_active=True;s.commit()
  r=self.client.post("/api/v1/login-form",files={"email":(None,self.email),"password":(None,self.password)});self.assertEqual(r.status_code,200);self.assertTrue("Secure" in r.headers["set-cookie"],"production cookie must be Secure")
 def test_container_uses_dependency_lock(self):
  dockerfile=(Path(__file__).resolve().parents[2]/"Dockerfile").read_text();self.assertTrue("-r requirements.lock.txt" in dockerfile,"build must consume reviewed transitive dependency lock")
 def test_production_bypass_disabled(self):
  self.assertEqual(self.client.post("/api/v1/login/dev",json={"email":self.email}).status_code,403)
  self.assertEqual(self.client.post("/testing/normalize-names").status_code,403)
if __name__=="__main__":unittest.main()
