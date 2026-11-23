#!/usr/bin/env python3
"""Tiny level-driven controller. No third-party Python packages; kubectl handles TLS/auth.
Run only on kind-kv-lab. --once reconciles all WebApps one time; default repeats.
This polling teaching controller deliberately omits leader election, finalizers,
watch caches and production rate limiting. It never forces SSA ownership.
"""
import argparse, json, re, subprocess, sys, time
CTX, NS = 'kind-kv-lab', 'kv-lab'
def k(*args, data=None):
    result = subprocess.run(['kubectl','--context',CTX,'-n',NS,*args], input=json.dumps(data) if data is not None else None, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout.strip() else {}
def existing(kind,name):
    return k('get',kind,name,'--ignore-not-found','-o','json')
def reconcile(obj):
    name, uid = obj['metadata']['name'], obj['metadata']['uid']
    if obj['metadata'].get('deletionTimestamp'):
        return
    owner = {'apiVersion':obj['apiVersion'],'kind':'WebApp','name':name,'uid':uid,'controller':True,'blockOwnerDeletion':True}
    labels = {'app':name,'lab':obj['metadata'].get('labels',{}).get('lab','m16')}
    md = {'name':name,'namespace':NS,'labels':labels,'ownerReferences':[owner]}
    resources = [
      {'apiVersion':'v1','kind':'ConfigMap','metadata':md,'data':{'index.html':obj['spec']['message']+'\n'}},
      {'apiVersion':'apps/v1','kind':'Deployment','metadata':md,'spec':{'replicas':obj['spec']['replicas'],'selector':{'matchLabels':{'app':name}},'template':{'metadata':{'labels':labels},'spec':{'containers':[{'name':'web','image':'nginx:1.28.0-alpine','ports':[{'containerPort':80}],'volumeMounts':[{'name':'page','mountPath':'/usr/share/nginx/html','readOnly':True}]}],'volumes':[{'name':'page','configMap':{'name':name}}]}}}}
    ]
    for desired in resources:
        current = existing(desired['kind'],name)
        if current and not any(o.get('uid') == uid and o.get('controller') for o in current['metadata'].get('ownerReferences',[])):
            raise RuntimeError('Refusing to adopt unowned '+desired['kind']+'/'+name)
        k('apply','--server-side','--field-manager=kv-webapp-operator','-f','-','-o','json',data=desired)
    dep = k('get','deployment',name,'-o','json')
    status = {'observedGeneration':obj['metadata']['generation'],'readyReplicas':dep.get('status',{}).get('readyReplicas',0)}
    k('patch','webapp',name,'--subresource=status','--type=merge','-p',json.dumps({'status':status}),'-o','json')
    print('reconciled '+name+' replicas='+str(obj['spec']['replicas']),flush=True)
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--once',action='store_true')
    parser.add_argument('--iterations',type=int,default=6)
    parser.add_argument('--interval',type=float,default=2)
    args = parser.parse_args()
    client = subprocess.run(['kubectl','version','--client','-o','json'],capture_output=True,text=True,check=True)
    version = json.loads(client.stdout)['clientVersion']['gitVersion']
    if not re.fullmatch(r'v1\.37\.[0-9]+(?:[+-].*)?',version):
        raise RuntimeError('Refusing: kubectl v1.37.x required for the pinned v1.37 cluster; found '+version)
    config = subprocess.run(['kubectl','config','view','-o','json'],capture_output=True,text=True,check=True)
    contexts = json.loads(config.stdout)['contexts']
    assert any(c['name']==CTX and c['context']['cluster']==CTX for c in contexts), 'Only named disposable context is accepted'
    clusters = subprocess.run(['kind','get','clusters'],capture_output=True,text=True,check=True).stdout.splitlines()
    assert 'kv-lab' in clusters, 'Named disposable kind cluster is absent'
    actual = sorted(n['metadata']['name'] for n in k('get','nodes','-o','json')['items'])
    expected = sorted(subprocess.run(['kind','get','nodes','--name','kv-lab'],capture_output=True,text=True,check=True).stdout.splitlines())
    assert actual == expected, 'Context nodes differ from named disposable cluster'
    for i in range(1 if args.once else args.iterations):
        for obj in k('get','webapps','-o','json')['items']:
            reconcile(obj)
        if not args.once and i+1<args.iterations:
            time.sleep(args.interval)
if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
