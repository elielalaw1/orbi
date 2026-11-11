#version 300 es
precision highp float;
out vec4 frag;
uniform vec2 uRes;
uniform vec2 uRoutine;
uniform vec3 uColor;
uniform vec4 uExpression; // eye height, smile, mouth opening, eyebrow lift
uniform vec4 uFace; // azimuth, elevation, scale, roll
uniform vec4 uDetails; // eyebrow tilt, wink, eye spacing, mouth scale
uniform vec4 uMotion; // gaze x, gaze y, blink, breath
uniform vec2 uExtra; // brow offset, lean
uniform float uBrightness;
uniform bool uGuides;
const float PI=3.14159265359;
// Adapted from EX-03 Pulse, Wisdome 360, David Cuartielles. GPL-3.0.
vec3 roomDir(vec2 p){
 float r=length(p),th=r*radians(80.0);vec2 d=r>1e-6?p/r:vec2(0);
 vec3 l=vec3(sin(th)*d.x,-sin(th)*d.y,cos(th));
 float c=cos(radians(26.0)),s=sin(radians(26.0));
 return vec3(l.x,l.y*c+l.z*s,-l.y*s+l.z*c);
}
float mask(float d){return 1.-smoothstep(-fwidth(d),fwidth(d),d);}
float ellipse(vec2 p,vec2 r){return (length(p/r)-1.)*min(r.x,r.y);}
float line(float d,float w){return 1.-smoothstep(w,w+.18,abs(d));}
void main(){
 vec2 p=gl_FragCoord.xy/uRes*2.-1.;if(length(p)>1.){frag=vec4(0,0,0,1);return;}
 vec3 rd=roomDir(p);float a=radians(uFace.x),e=radians(uFace.y);
 vec3 forward=vec3(sin(a)*cos(e),cos(a)*cos(e),sin(e));
 // Project the room right axis into the tangent plane; stable across the zenith.
 vec3 right=normalize(vec3(1.,0.,0.)-forward*forward.x),up=cross(right,forward);
 float f=dot(rd,forward);vec2 tangent=vec2(dot(rd,right),dot(rd,up));
 float angle=atan(length(tangent),f);vec2 q=length(tangent)>1e-6?tangent/length(tangent)*degrees(angle):vec2(0);
 float rot=radians(uFace.w);q=mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*q;
 q/=uFace.z*uMotion.w;q.x/=1.+uExtra.y;q.y*=1.+uExtra.y;
 // Oversized animation-style eyes and a simple grin; the architecture is the head.
 float lightBand=smoothstep(.0,.7,dot(rd,normalize(vec3(-.3,.5,.8))));
 vec3 col=uColor*(.97+.03*lightBand);
 vec3 ink=vec3(.025,.018,.04);
 if(f>0.&&abs(q.x)<30.&&abs(q.y)<25.){
 for(int i=0;i<2;i++){
  float side=i==0?-1.:1.;vec2 ep=q-vec2(side*uDetails.z,4.4);
  float wink=i==1?uDetails.y:0.;
  float height=max(.32,10.4*uExpression.x*uMotion.z*(1.-wink*.96)*(1.+side*.025*uMotion.x));
  vec2 radii=vec2(8.6,height);
  float eyeDistance=ellipse(ep,radii),eye=mask(eyeDistance);
  float contact=exp(-max(ellipse(ep-vec2(.25,-.3),radii+vec2(.2,.3)),0.)*1.8);
  col=mix(col,uColor*.65,contact*.11);
  // Broad cool-white cartoon eyes, solid pupils; no anatomical iris or skin texture.
  vec3 white=mix(vec3(.77,.79,.96),vec3(.98,.97,1.),smoothstep(-.8,.5,ep.y/max(height,.32)));
  col=mix(col,white,eye);
  vec2 gaze=vec2(clamp(uMotion.x,-1.,1.)*3.2,clamp(uMotion.y,-1.,1.)*2.5);
  vec2 pupilR=vec2(4.15,min(5.0,max(.2,height*.65)));
  float pupil=mask(ellipse(ep-gaze,pupilR))*eye;
  col=mix(col,vec3(.008,.009,.02),pupil);
  float glint=mask(ellipse(ep-gaze-vec2(-1.0,1.4),vec2(.65,min(.8,height*.2))));
  col=mix(col,vec3(1.,.99,1.),glint*pupil*.7);
  if(uRoutine.x>0.){
   vec2 h=(ep-gaze)/vec2(5.5,max(.4,height*.7));h.y+=.15;
   float v=dot(h,h)-1.;
   float heart=mask(v*v*v-h.x*h.x*h.y*h.y*h.y)*eye;
   col=mix(col,vec3(1.,.035,.25),heart*uRoutine.x);
  }
  // A golden upper lid makes sleepy, curious, angry and surprised looks readable.
  float lidY=height*(.86-.10*max(0.,-uExpression.w));
  float lid=mask(-(ep.y-lidY))*eye;
  col=mix(col,uColor*.99,lid);
  vec2 b=q-vec2(side*uDetails.z,16.6+uExpression.w*1.35+uExtra.x);
  float bx=clamp(b.x,-7.,7.);
  float arch=.85*(1.-pow(bx/7.4,2.));float slope=side*uDetails.x*.32;
  float brow=mask(length(vec2(b.x-bx,b.y-arch-slope*bx))-.92);
  col=mix(col,ink,brow);
 }
 vec2 m=(q-vec2(0,-8.5))/vec2(uDetails.w,1.);
 float opening=uExpression.z,smile=uExpression.y;
 if(uRoutine.y>0.){m.x*=3.;opening=.3;smile=0.;}
 float width=mix(8.8,11.6,smoothstep(.1,.65,opening));width=mix(width,4.6,smoothstep(.78,1.,opening));
 float curve=smile*(4.3*pow(m.x/max(width,1.),2.)-1.8);
 vec2 mp=vec2(m.x,m.y-curve),mr=vec2(width,.48+opening*5.0);
 float mouth=mask(ellipse(mp,mr));
 col=mix(col,mix(ink,vec3(.95,.035,.24),uRoutine.y),mouth);
 float teeth=mask(max(abs(mp.x)-width*.83,abs(mp.y-mr.y*.64)-(.38+opening*.5)))*mouth*smoothstep(.28,.5,opening)*(1.-smoothstep(.8,1.,opening));
 col=mix(col,vec3(1.,.98,.88),teeth);
 float tongue=mask(ellipse(mp+vec2(0.,mr.y*.73),vec2(width*.56,max(.4,mr.y*.32))))*mouth*smoothstep(.4,.6,opening)*(1.-smoothstep(.85,1.,opening));
 col=mix(col,vec3(1.,.27,.36),tongue);
 float cheek=exp(-pow((abs(q.x)-23.)/3.3,2.)-pow((q.y+4.)/2.4,2.));
 col=mix(col,vec3(1.,.28,.19),cheek*.08*max(smile,0.));
 }

 if(uGuides){
 float el=degrees(asin(clamp(rd.z,-1.,1.))),az=degrees(atan(rd.x,rd.y));
 float comfort=max(abs(az)-60.,max(-16.-el,el-45.));
 float outline=line(comfort,.22),sweet=1.-smoothstep(.6,1.1,length(vec2(az,el-20.)));
 float grid=max(line(mod(el+7.5,15.)-7.5,.08),line(mod(az+15.,30.)-15.,.08));
 col=mix(col,vec3(.1,.45,.8),grid*.35);col=mix(col,vec3(.15,.95,.77),outline);col=mix(col,vec3(1.),sweet);
 float front=line(az,.4)*(1.-smoothstep(-13.,-10.,el));col=mix(col,vec3(1.,.18,.1),front);
 }
 frag=vec4(clamp(col*uBrightness,0.,1.),1.);
}
