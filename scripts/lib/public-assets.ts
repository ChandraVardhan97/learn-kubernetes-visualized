import {existsSync,lstatSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

const privateDirectories=new Set(['backup','backups','snapshots','credentials','.kube','.ssh']);
const privateFile=/(?:\.(?:db|kubeconfig|key|pem|p12|pfx)$)|(?:^id_(?:rsa|ed25519)$)|(?:^\.?env(?:\.|$))|(?:^kubeconfig(?:\.|$))/i;

export function unsafePublicAssets(root:string):string[]{
 const unsafe:string[]=[];
 function walk(dir:string,relative:string){for(const name of readdirSync(dir)){
  const file=join(dir,name),key=relative?`${relative}/${name}`:name;const stat=lstatSync(file);
  if(stat.isSymbolicLink()||privateFile.test(name)||(stat.isDirectory()&&privateDirectories.has(name.toLowerCase())))unsafe.push(key);
  else if(stat.isDirectory())walk(file,key);
 }}
 if(existsSync(root))walk(root,'');return unsafe.sort();
}

export function unexpectedLabAssets(root:string,allowed:Set<string>):string[]{
 const unexpected:string[]=[];const labs=join(root,'labs');
 function walk(dir:string,relative:string){for(const name of readdirSync(dir)){
  const file=join(dir,name),key=relative?`${relative}/${name}`:name;const stat=lstatSync(file);
  if(stat.isDirectory())walk(file,key);else if(stat.isSymbolicLink()||!allowed.has(key))unexpected.push(`labs/${key}`);
 }}
 if(existsSync(labs))walk(labs,'');return unexpected.sort();
}
