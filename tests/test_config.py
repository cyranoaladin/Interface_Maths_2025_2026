import importlib
def test_config_imports():
    import app.config
    importlib.reload(app.config)
