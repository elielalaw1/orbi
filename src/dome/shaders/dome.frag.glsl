#version 300 es
precision highp float;
out vec4 frag;
uniform vec2 uRes;
uniform vec4 uRoutine;
uniform vec2 uEscape; // character visibility, eyes-only peek
uniform vec2 uScene;
uniform vec4 uEchoPose[8];
uniform vec4 uEchoExpression[8];
uniform float uFire;
uniform vec3 uColor;
uniform vec4 uExpression; // eye height, smile, mouth opening, eyebrow lift
uniform vec4 uFace; // azimuth, elevation, scale, roll
uniform vec4 uDetails; // eyebrow tilt, wink, eye spacing, mouth scale
uniform vec4 uMotion; // gaze x, gaze y, blink, breath
uniform vec2 uExtra; // brow offset, lean
uniform float uBrightness;
uniform bool uGuides;
uniform float uFloodTime;
const float PI=3.14159265359;
// Adapted from EX-03 Pulse, Wisdome 360, David Cuartielles. GPL-3.0.
vec3 roomDir(vec2 p){
 float r=length(p),th=r*radians(80.0);vec2 d=r>1e-6?p/r:vec2(0);
 vec3 l=vec3(sin(th)*d.x,-sin(th)*d.y,cos(th));
 float c=cos(radians(26.0)),s=sin(radians(26.0));
 return vec3(l.x,l.y*c+l.z*s,-l.y*s+l.z*c);
}
float squared(float x){return x*x;}
float mask(float d){return 1.-step(0.,d);}
float ellipse(vec2 p,vec2 r){return (length(p/r)-1.)*min(r.x,r.y);}
float line(float d,float w){return 1.-smoothstep(w,w+.18,abs(d));}
// Room-space wave height and slope. The same waves shape the shoreline,
 // bend the face and distort the view through the pool's surface.
vec3 waterWave(vec2 p, float t){
 vec2 k1=vec2(3.1,1.7),k2=vec2(-2.4,4.8),k3=vec2(7.2,-3.3);
 float a=dot(p,k1)-t*.88,b=dot(p,k2)+t*1.13,c=dot(p,k3)-t*1.74;
 float height=.032*sin(a)+.018*sin(b)+.009*sin(c);
 vec2 slope=.032*k1*cos(a)+.018*k2*cos(b)+.009*k3*cos(c);
 return vec3(height,slope);
}
float floodDepth(vec3 ray, float t){
 float height=-.62+.77*smoothstep(3.,35.,t)+.84*smoothstep(35.,95.,t)
   +.46*smoothstep(95.,116.,t);
 return height-ray.z-.86*ray.y+waterWave(ray.xy*2.2,t).x;
}
vec2 waterHash(vec2 cell){
 return fract(sin(vec2(dot(cell,vec2(127.1,311.7)),
                       dot(cell,vec2(269.5,183.3))))*43758.5453);
}
// The gap between the nearest two moving cells traces a net of focused light.
float causticNet(vec2 uv,float t){
 vec2 cell=floor(uv),local=fract(uv);
 float nearest=10.,second=10.;
 for(int y=-1;y<=1;y++){
  for(int x=-1;x<=1;x++){
   vec2 offset=vec2(float(x),float(y));
   vec2 seed=waterHash(cell+offset);
   vec2 point=offset+.5+.34*sin(seed*6.28318+t*vec2(.84,.71));
   vec2 delta=point-local;
   float distance=dot(delta,delta);
   second=min(second,max(nearest,distance));
   nearest=min(nearest,distance);
  }
 }
 return exp(-11.*max(0.,second-nearest));
}
vec3 risingBubbles(vec3 ray,float t,float depth){
 float azimuth=atan(ray.x,ray.y)/6.2831853+.5;
 float elevation=asin(clamp(ray.z,-1.,1.));
 vec3 light=vec3(0.);
 // Angular layers have different sizes and rise speeds. Azimuth wraps at the rear.
 for(int layer=0;layer<3;layer++){
  float k=float(layer),columns=16.+k*9.;
  vec2 grid=vec2(azimuth*columns,elevation*(3.2+k*1.6)-t*(.40+k*.13));
  vec2 cell=floor(grid);
  vec2 seed=waterHash(vec2(mod(cell.x,columns),cell.y)+k*39.7);
  vec2 centre=vec2(.5+.11*sin(t*1.8+seed.x*19.),.22+.56*seed.y);
  vec2 local=(fract(grid)-centre)*vec2(1.,1.27);
  float radius=mix(.029,.13,seed.y)/(1.+k*.24);
  float distance=length(local)/radius;
  float rim=smoothstep(.69,.88,distance)*(1.-smoothstep(.92,1.08,distance));
  float glint=1.-smoothstep(.09,.32,length(local/radius-vec2(-.35,.55)));
  float shell=(rim*(.30+.32*max(0.,local.y/radius))+glint*.85);
  float visibility=step(.40+k*.10,seed.x)*smoothstep(.015,.16,depth);
  light+=vec3(.64,.84,1.)*shell*visibility/(1.+k*.44);
 }
 return light;
}
vec3 floodWater(vec3 color, vec3 ray, float t, float depth){
 if(depth<-.08)return color;
 float submerged=smoothstep(-.019,.036,depth);
 float edge=exp(-abs(depth)*135.);
 float crest=exp(-abs(depth-.026)*51.);
 vec2 plane=ray.xy*min(4.8,.73/max(ray.z,.13));
 vec3 wave=waterWave(plane*2.8,t);
 vec3 normal=normalize(vec3(-wave.yz*1.7,1.));
 float incidence=max(0.,dot(ray,normal));
 float reflection=pow(1.-incidence,4.);
 vec2 distorted=plane*7.+wave.yz*2.6;
 float caustic=causticNet(distorted,t);
 float daylight=smoothstep(-.04,.85,ray.z);
 float shafts=pow(max(0.,sin(distorted.x*.81+distorted.y*.56)),5.);
 vec3 pool=mix(vec3(.022,.073,.23),vec3(.22,.49,.83),daylight);
 pool=mix(pool,vec3(.047,.16,.39),reflection*.66);
 pool+=vec3(.36,.59,.89)*caustic*(.13+.48*daylight);
 pool+=vec3(.08,.20,.36)*shafts*daylight;
 float opacity=mix(.27,.92,smoothstep(.035,.48,depth));
 opacity=mix(opacity,1.,smoothstep(106.,117.,t));
 vec3 transmitted=mix(color*vec3(.84,.89,1.),pool,opacity);
 vec3 bubbles=risingBubbles(ray,t,depth);
 float foam=pow(max(0.,.5+.5*sin(distorted.x*13.+sin(distorted.y*9.))),5.);
 return mix(color,transmitted+bubbles,submerged)
   +vec3(.56,.77,1.)*(edge*.36+crest*foam*.20);
}
float stroke(vec2 p, vec2 a, vec2 b, float width){
 vec2 axis=b-a;
 return step(length(p-a-axis*clamp(dot(p-a,axis)/max(.001,dot(axis,axis)),0.,1.)),width);
}
// A compact arcade flame in local coordinates: y=0 at its base, y=1 at its tip.
vec4 arcadeFlame(vec2 uv,float beat){
 vec2 g=(floor(uv*22.)+.5)/22.;
 float y=g.y;
 if(y<0. || y>1.12)return vec4(0.);
 float x=g.x-.18*y*y*sin(beat+5.*y);
 float belly=.46*sqrt(max(0.,1.-squared((y-.31)/.69)))*(1.-smoothstep(.28,1.,y));
 float fork=.13*(1.-smoothstep(.23,.74,y));
 bool outer=abs(x)<belly || abs(x+.39-.14*y)<fork || abs(x-.34-.13*y)<fork*.85;
 if(!outer)return vec4(0.);
 float inner=abs(x+.04*sin(beat+y*7.))/max(.015,belly);
 vec3 color=vec3(.83,.105,.045);
 if(inner<.81 && y<.81)color=vec3(1.,.36,.015);
 if(inner<.57 && y<.62)color=vec3(1.,.79,.035);
 if(inner<.27 && y<.31)color=vec3(1.,.95,.48);
 return vec4(color,1.);
}
// The circular field is measured from the room zenith, independent of projector tilt.
vec3 gestureStage(vec3 ray,float scene,float t){
 float el=asin(clamp(ray.z,-1.,1.));
 float az=atan(ray.x,ray.y+.000001);
 float radius=(.5*PI-el)/1.57;
 vec2 sky=ray.xy/max(.00001,length(ray.xy))*radius;
 vec3 night=vec3(.045,.055,.16),mint=vec3(.26,.97,.84),pink=vec3(1.,.29,.55);
 vec3 cream=vec3(1.,.94,.65);
 if(scene==2.){
   vec3 c=night+vec3(.06,.025,.12)*(1.-min(radius,1.));
   vec2 stars=fract(sky*15.+.23)-.5;
   if(length(stars)<.072 && sin(dot(floor(sky*15.+.23),vec2(41.,17.)))>.2)c=cream;
   float orbit=length(sky*vec2(1.,1.45));
   if(abs(orbit-.69)<.009)c=vec3(.21,.31,.49);
   vec2 moon=sky-.69*vec2(cos(t*1.24),sin(t*1.24)/1.45);
   if(length(moon)<.09)c=length(moon+vec2(.031,.02))<.032?vec3(.55,.34,.45):cream;
   vec2 planet=sky-vec2(.0,.02);
   if(length(planet)<.22)c=mix(pink,cream,.36*step(.48,fract(planet.y*22.+.3*sin(planet.x*11.))));
   if(abs(length(vec2(planet.x,(planet.y+planet.x*.32)*4.))-.29)<.021 && (planet.y+planet.x*.32<0.||length(planet)>.22))c=mint;
   return c;
 }
 // Cylindrical lanes repeat at whole turns so the join behind the audience is invisible.
 float turn=az/(2.*PI)+.5;
 return night;
}

// Pixel coordinates are angular, so the ring stays in front of the audience.
bool boxPixel(vec2 p, vec2 halfSize){return all(lessThanEqual(abs(p),halfSize));}
void boxingGlove(inout vec3 c, vec2 p,vec3 leather){
 if(length(p)<4.4)c=vec3(.10,.06,.12);
 if(length(p)<3.6)c=leather;
 if(boxPixel(p-vec2(-1.,1.5),vec2(1.5,.55)))c=vec3(1.,.84,.67);
}
void boxer(inout vec3 c,vec2 p,float facing,float strike,float lift,float knocked,vec3 skin,vec3 leather){
 p.x*=facing;
 float angle=knocked*1.48;
 p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
 vec3 ink=vec3(.10,.065,.13);
 if(boxPixel(p-vec2(-4.,-11.),vec2(3.,2.))||boxPixel(p-vec2(5.,-11.),vec2(3.,2.)))c=ink;
 float head=length(p/vec2(10.,10.5));
 if(head<1.12)c=ink;
 if(head<1.)c=mix(skin*.78,skin,step(-5.,p.y));
 if(head<1. && abs(p.y-7.)<1.4)c=leather;
 for(int i=0;i<2;i++){
   vec2 eye=p-vec2(-3.+6.*float(i),2.);
   if(knocked>.45){
     if(max(abs(eye.x),abs(eye.y))<2.5 && abs(abs(eye.x)-abs(eye.y))<1.)c=ink;
   }else{
     if(boxPixel(eye,vec2(2.,2.4)))c=vec3(1.,.98,.86);
     if(boxPixel(eye-vec2(.8,0.),vec2(.85,1.5)))c=ink;
     if(stroke(eye,vec2(-2.,4.),vec2(2.,3.),.7)>.5)c=ink;
   }
 }
 if(boxPixel(p-vec2(2.,-4.),vec2(2.8,1.)))c=ink;
 vec2 lead=mix(vec2(8.,-2.),vec2(25.,2.),strike);
 lead=mix(lead,vec2(10.,13.),lift);
 vec2 rear=vec2(-8.,-3.+lift*15.);
 if(stroke(p,vec2(4.,-5.),lead,1.8)>.5 || stroke(p,vec2(-5.,-5.),rear,1.8)>.5)c=skin;
 boxingGlove(c,p-lead,leather);
 boxingGlove(c,p-rear,leather*.86);
}
// Evaluate just the seat under this pixel: 144 columns around the room, 20 tiers.
vec3 grandstand(vec2 arena,float t,float cheer){
 vec3 navy=vec3(.055,.055,.14);
 float row=floor((arena.y+6.)/2.6);
 if(row<0. || row>=20.)return navy;
 float seat=arena.x*144./(2.*PI*78.)+.5*mod(row,2.);
 float seed=fract(sin(dot(vec2(floor(seat),row),vec2(57.23,21.37)))*4375.8);
 vec2 local=vec2(fract(seat)-.5,fract((arena.y+6.)/2.6)-.5);
 float hop=abs(sin(t*(3.+seed*3.)+seed*16.+row*.2));
 local.y-=hop*(.04+.16*cheer);
 vec3 shirt=mix(vec3(.20,.33,.58),vec3(.98,.64,.10),step(.38,seed));
 vec3 c=mix(navy,vec3(.19,.14,.30),step(.44,abs(local.y)));
 if(abs(local.x)<.23 && local.y<.03 && local.y>-.38)c=shirt;
 if(length(local-vec2(0.,.13))<.17)c=mix(vec3(.70,.39,.24),vec3(1.,.85,.56),seed);
 float arm=abs(local.x);
 if(arm>.17 && arm<.46 && abs(local.y-(arm-.18)*(.65+cheer*1.4)*hop+.05)<.07)c=shirt;
 return c;
}

vec3 fireworks(vec3 c,vec2 p,float time){
 if(time<0.)return c;
 float lane=floor((p.x+21.)/42.);
 float age=mod(time+fract(lane*.618)*.8,1.65);
 vec2 delta=vec2(mod(p.x+21.,42.)-21.,p.y-36.-9.*sin(lane*5.));
 if(age<.23){
   if(abs(delta.x)<.65 && abs(delta.y+16.-age*70.)<2.)return vec3(1.,.82,.46);
 }else{
   float burst=age-.23;
   delta.y+=8.*burst*burst;
   float radius=length(delta);
   float spoke=abs(sin(atan(delta.y,delta.x+.00001)*7.+lane));
   float sparks=(1.-smoothstep(.10,.42,spoke))*(1.-smoothstep(.6,2.2,abs(radius-17.*burst)));
   vec3 hue=mix(vec3(1.,.42,.65),vec3(.55,.96,1.),step(.0,sin(lane*4.+floor(time/1.65))));
   c=mix(c,hue,sparks*(1.-smoothstep(.78,1.35,burst)));
 }
 return c;
}

vec3 boxingMatch(vec2 arena,float t){
 vec2 p=floor(arena);
 float cheer=smoothstep(7.8,8.15,t);
 vec3 c=p.y < -15.?vec3(.13,.22,.35):grandstand(arena,t,cheer);
 c=fireworks(c,floor(arena*2.)*.5,t-7.9);
 if(abs(p.x)<48. && (abs(p.y+10.)<1. || abs(p.y+3.)<1. || abs(p.y-5.)<1.))c=vec3(.67,.37,.40);
 if(abs(abs(p.x)-47.)<2. && p.y<9. && p.y> -16.)c=vec3(.85,.62,.34);
 // Contact cues measured from the supplied voice recording, in seconds.
 const float hits[10]=float[10](.845,1.23,1.53,1.79,3.03,3.20,3.51,5.22,5.47,6.32);
 float jab=0.,recoil=0.,spark=0.;
 for(int i=0;i<10;i++){
   float d=t-hits[i];
   jab=max(jab,smoothstep(-.12,0.,d)*(1.-smoothstep(.015,.14,d)));
   recoil=max(recoil,smoothstep(-.015,.05,d)*(1.-smoothstep(.05,.20,d)));
   spark=max(spark,1.-smoothstep(.02,.11,abs(d)));
 }
 float fall=smoothstep(6.32,7.12,t), lift=smoothstep(7.4,8.1,t);
 float load=smoothstep(9.6,10.9,t);
 float vanX= mix(156.,41.,smoothstep(7.8,9.6,t))+115.*smoothstep(11.6,14.3,t);
 vec2 hero=vec2(-18.+jab*2.,-2.+(1.-lift)*abs(sin(t*8.))*1.5);
 boxer(c,p-hero,1.,jab,lift,0.,vec3(1.,.78,.12),vec3(.94,.15,.15));
 vec2 rival=mix(vec2(15.+recoil*4.+fall*7.,-2.-fall*6.),vec2(vanX-3.,-1.),load);
 if(load<.99)boxer(c,p-rival,-1.,0.,0.,fall,vec3(.35,.83,.91),vec3(.24,.34,.88));
 vec2 flash=p-vec2(9.,1.);
 if(spark>.1 && length(flash)<7.*spark && min(min(abs(flash.x),abs(flash.y)),abs(abs(flash.x)-abs(flash.y)))<1.1)c=vec3(1.,.94,.59);
 vec2 v=p-vec2(vanX,-3.);
 if(boxPixel(v,vec2(13.,7.)) || boxPixel(v-vec2(14.,-2.),vec2(4.,5.)))c=vec3(.92,.95,.91);
 if(boxPixel(v-vec2(12.,1.),vec2(3.,2.)))c=vec3(.22,.42,.54);
 if(boxPixel(v-vec2(-2.,0.),vec2(1.,4.)) || boxPixel(v-vec2(-2.,0.),vec2(4.,1.)))c=vec3(.84,.12,.16);
 if(load<.99 && boxPixel(v-vec2(-11.,-1.),vec2(2.,5.)))c=vec3(.18,.25,.32);
 if(abs(abs(v.x-1.)-9.)<3. && abs(v.y+8.)<3.)c=vec3(.07,.08,.13);
 if(boxPixel(v-vec2(5.,8.),vec2(3.,1.)))c=mix(vec3(.3,.52,.95),vec3(1.,.25,.18),step(.5,fract(t*3.)));
 if(lift>.8){
   vec2 crown=p-hero-vec2(0.,10.+8.*(1.-smoothstep(7.85,8.25,t)));
   if(abs(crown.x)<6. && crown.y>=0. && crown.y<2.+abs(mod(crown.x+2.,4.)-2.))c=vec3(1.,.85,.24);
 }
 return c;
}

// Use a room-space tangent frame so the two faces can circle independently.
vec2 roseLocal(vec3 ray,float azimuth,float elevation,float size){
 float a=radians(azimuth),e=radians(elevation);
 vec3 forward=vec3(sin(a)*cos(e),cos(a)*cos(e),sin(e));
 vec3 right=vec3(cos(a),-sin(a),0.);
 vec3 up=cross(right,forward);
 float facing=dot(ray,forward);
 if(facing<=0.)return vec2(1e4);
 return degrees(vec2(dot(ray,right),dot(ray,up))) / (size*max(.1,facing));
}
void roseCharacter(inout vec3 color,vec2 p,float look,float shy,float smile,float visibility,vec3 gold,float blink){
 vec2 pixel=floor(p)+.5;
 float head=length(pixel/vec2(12.,11.));
 if(head>1.11)return;
 vec3 ink=vec3(.15,.064,.17);
 vec3 face=head>1.?ink:mix(gold*.74,gold,smoothstep(-9.,2.,pixel.y));
 if(head<1.){
  for(int i=0;i<2;i++){
   float side=float(i)*2.-1.;
   vec2 eye=pixel-vec2(side*4.5,2.-shy*1.4);
   if(boxPixel(eye,vec2(2.9,(3.-shy*1.2)*(1.-blink))))face=vec3(1.,.97,.88);
   if(boxPixel(eye-vec2(look*1.15,-shy*.7),vec2(1.4,(1.8-shy*.6)*(1.-blink))))face=ink;
   if(boxPixel(pixel-vec2(side*8.,-2.5),vec2(1.7,.8)))face=mix(face,vec3(.93,.24,.29),.27+shy*.47);
  }
  float mouthY=-5.+smile*.19*pixel.x*pixel.x;
  if(abs(pixel.x)<3.9 && abs(pixel.y-mouthY)<.85)face=ink;
 }
 color=mix(color,face,visibility);
}
vec3 roseStory(vec3 ray,float t){
 // They pass at different elevations, then the shy Orbi waits at the front.
 float giver=mix(0.,172.,smoothstep(5.,13.7,t))
   +165.*smoothstep(14.1,21.1,t);
 float receiver=180.-155.*smoothstep(5.8,14.4,t)
   -361.*smoothstep(14.5,19.3,t);
 float giverElevation=22.+31.*(.5-.5*cos(radians(giver)));
 float receiverElevation=22.+31.*(.5-.5*cos(radians(receiver)))
   +24.*smoothstep(5.5,7.5,t)*(1.-smoothstep(18.,20.,t));
 vec3 color=mix(vec3(.034,.021,.072),vec3(.19,.054,.15),smoothstep(-.2,.92,ray.z));
 vec2 a=roseLocal(ray,giver,giverElevation,1.);
 vec2 b=roseLocal(ray,receiver,receiverElevation,.96);
 float shy=1.-smoothstep(19.5,22.,t);
 roseCharacter(color,b,-.8,shy,.4+.55*(1.-shy),smoothstep(2.2,4.1,t),vec3(1.,.68,.33),0.);
 roseCharacter(color,a,.8,0.,.60+.35*smoothstep(19.8,21.9,t),1.,vec3(1.,.79,.17),0.);
 float reach=smoothstep(.6,2.0,t);
 float meeting=smoothstep(19.7,21.5,t);
 vec2 hand=vec2(13.+8.*meeting,-8.);
 vec2 bud=hand+vec2(3.,13.+reach*2.);
 vec2 pixel=floor(a)+.5;
 float halo=exp(-dot(a-bud,a-bud)*.044);
 color+=vec3(.43,.055,.13)*halo*reach;
 if(stroke(pixel,vec2(10.,-5.),hand,1.45)>.5)color=vec3(.98,.73,.28);
 if(stroke(pixel,hand,bud,.85)>.5 || stroke(pixel,hand+vec2(1.,6.),hand+vec2(-3.,9.),1.2)>.5)
   color=vec3(.29,.71,.34);
 if(abs(pixel.x-bud.x)+.85*abs(pixel.y-bud.y)<5.)
   color=pixel.y>bud.y+1.?vec3(1.,.49,.56):vec3(.96,.10,.29);
 if(boxPixel(pixel-hand,vec2(1.55)))color=vec3(1.,.86,.52);
 return color;
}
vec3 echoStory(vec3 ray,float t){
 vec3 color=mix(vec3(.013,.024,.065),vec3(.065,.11,.23),max(0.,ray.z));
 float rear=smoothstep(15.5,17.,t)*(1.-smoothstep(24.,26.,t));
 vec3 rearDirection=vec3(0.,-.545,.839);
 color+=vec3(.11,.07,.19)*rear*pow(max(0.,dot(ray,rearDirection)),17.);
 for(int i=7;i>=0;i--){
   vec4 pose=uEchoPose[i],expression=uEchoExpression[i];
   if(pose.w<=.001)continue;
   vec2 local=roseLocal(ray,pose.x,pose.y,pose.z);
   if(abs(local.x)>22. || abs(local.y)>22.)continue;
   float angle=radians(expression.z);
   local=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*local;
   vec3 tint=i==0?vec3(1.,.79,.18):mix(vec3(.44,.74,1.),vec3(.92,.65,1.),float(i)/7.);
   if(i==7)tint=mix(tint,vec3(1.,.78,.36),rear);
   color+=tint*exp(-dot(local,local)*.017)*pose.w*.085;
   roseCharacter(color,local,expression.x,0.,expression.y,pose.w,tint,expression.w);
 }
 return color;
}
void main(){
 vec2 p=gl_FragCoord.xy/uRes*2.-1.;if(length(p)>1.){frag=vec4(0,0,0,1);return;}
 vec3 rd=roomDir(p);float a=radians(uFace.x),e=radians(uFace.y);
 vec3 forward=vec3(sin(a)*cos(e),cos(a)*cos(e),sin(e));
 // Outside the face footprint the dome has one flat colour.
 // The 40-degree radius encloses the 30 by 25 degree facial bounds.
 vec3 gold=mix(vec3(1.,.76,.09),uColor,.16);
 // The emotional colour eases back to gold as the character cools.
 float heat=1.-smoothstep(.11,.46,uColor.g);
 gold=mix(gold,vec3(.96,.09,.035),heat);
 if(uFire>.001){
   float az=atan(rd.x,rd.y);
   float elevation=asin(clamp(rd.z,-1.,1.));
   float lane=(az+PI)*(18./(2.*PI));
   float seed=floor(lane);
   float beat=floor(uRoutine.w*10.)*.48+seed*2.4;
   float height=uFire*(1.25+.32*sin(seed*3.1)+.18*sin(beat));
   vec2 uv=vec2(fract(lane)-.5,(elevation+.48)/max(.01,height));
   vec4 fire=arcadeFlame(uv,beat);
   gold=mix(gold,fire.rgb,fire.a*uFire);
   vec2 ember=vec2(fract(lane)-.5-.17*sin(beat*.5),uv.y-.78-fract(beat*.12)*.52);
   if(abs(ember.x)<.045 && abs(ember.y)<.035)gold=mix(gold,vec3(1.,.69,.08),uFire);
 }
 if(uRoutine.z>.001){
   vec2 pixel=floor(p*115.)/115.;
   float arc=atan(pixel.y,pixel.x);
   float band=fract(arc*3.1831-uRoutine.w*.85+floor(length(pixel)*28.)*.21);
   gold=mix(gold,vec3(1.,.94,.48),uRoutine.z*.33*step(.76,band)*step(.62,fract(length(pixel)*28.))*smoothstep(.15,.9,length(p)));
 }
 if(uScene.x==3. && uFloodTime<0.){
   float time=uScene.y;
   float zoom=smoothstep(1.05,2.95,time)*(1.-smoothstep(17.45,19.45,time));
   float appear=smoothstep(.25,.85,time)*(1.-smoothstep(19.4,20.,time));
   vec2 arena=vec2(atan(rd.x,rd.y+.000001),asin(clamp(rd.z,-1.,1.))-.35)*78.;
   vec2 center=mix(vec2(32.,31.),vec2(0.),zoom);
   vec2 offset=arena-center;
   float radius=mix(11.,275.,zoom)*appear;
   float edge=length(offset/vec2(1.4,1.))-
     radius*(1.+.045*cos(atan(offset.y,offset.x+.00001)*9.));
   if(appear>.0 && edge<1.1){
     vec3 bubble=edge>-.95?vec3(1.,.97,.85):
       boxingMatch(offset/mix(.29,1.,zoom),max(0.,time-3.));
     frag=vec4(bubble*uBrightness,1.);return;
   }
   if(appear>.0 && (length(arena-vec2(19.,19.))<2.*appear ||
      length(arena-vec2(24.,23.))<3.*appear)){
     frag=vec4(vec3(1.,.97,.85)*uBrightness,1.);return;
   }
 }
 float sceneTime=uScene.y;
 float envelope=smoothstep(0.,.6,sceneTime)*(1.-smoothstep(7.,8.,sceneTime));
 if(uScene.x==2. && envelope>0.){
   // Quantize the dome sample, then recover its calibrated direction.
   vec3 ray=roomDir((floor(p*160.)+.5)/160.);
   vec3 stage=gestureStage(ray,uScene.x,sceneTime);
   // Keep Orbi's yellow silhouette clear against the surrounding set.
   float head=smoothstep(cos(radians(34.*uFace.z)),cos(radians(28.*uFace.z)),dot(rd,forward));
   gold=mix(gold,stage,envelope*(1.-head));
 }
 float faceRadius=46.*uFace.z*uMotion.w*(1.+abs(uExtra.y));
 if(uFloodTime<0. && uScene.x!=4. && uScene.x!=5. && !uGuides && dot(rd,forward)<cos(radians(min(180.,faceRadius+2.)))){
   frag=vec4(clamp(gold*uBrightness,0.,1.),1.);
   return;
 }
 // Project the room right axis into the tangent plane; stable across the zenith.
 vec3 right=normalize(vec3(1.,0.,0.)-forward*forward.x),up=cross(right,forward);
 float f=dot(rd,forward);vec2 tangent=vec2(dot(rd,right),dot(rd,up));
 float angle=atan(length(tangent),f);vec2 q=length(tangent)>1e-6?tangent/length(tangent)*degrees(angle):vec2(0);
 float rot=radians(uFace.w);q=mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*q;
 float waterDepth=0.;
 if(uFloodTime>=0.){
  waterDepth=floodDepth(rd,uFloodTime);
  float wet=smoothstep(-.025,.075,waterDepth);
  q+=wet*waterWave(rd.xy*7.,uFloodTime).yz*3.4;
 }
 q/=uFace.z*uMotion.w;q.x/=1.+uExtra.y;q.y*=1.+uExtra.y;
 // Sample facial geometry on a grid that moves with the character.
 q=(floor(q/1.15)+.5)*1.15;
 // Oversized animation-style eyes and a simple grin; the architecture is the head.
 vec3 col=gold;
 vec3 dryBackground=col;
 vec3 ink=vec3(.075,.052,.12);
 if(f>0.&&abs(q.x)<30.&&abs(q.y)<25.){
 for(int i=0;i<2;i++){
  float side=i==0?-1.:1.;vec2 ep=q-vec2(side*uDetails.z,4.4);
  if(uScene.x==2.)ep.y-=envelope*(4.+2.*side)*(.7+.3*sin(sceneTime*2.+side));
  float wink=i==1?uDetails.y:0.;
  float height=max(.32,10.4*uExpression.x*uMotion.z*(1.-wink*.96)*(1.+side*.025*uMotion.x));
  vec2 radii=vec2(8.6,height);
  float eyeDistance=ellipse(ep,radii),eye=mask(eyeDistance);
  float contact=exp(-max(ellipse(ep-vec2(.25,-.3),radii+vec2(.2,.3)),0.)*1.8);
  col=mix(col,uColor*.65,contact*.11);
  // Broad cool-white cartoon eyes, solid pupils; no anatomical iris or skin texture.
  vec3 white=mix(vec3(.77,.79,.96),vec3(.98,.97,1.),smoothstep(-.8,.5,ep.y/max(height,.32)));
  col=mix(col,vec3(1.,.92,.74),eye);
  vec2 gaze=vec2(clamp(uMotion.x,-1.,1.)*3.2,clamp(uMotion.y,-1.,1.)*2.5);
  vec2 pupilR=vec2(5.4,min(6.8,max(.2,height*.78)));
  float pupil=mask(ellipse(ep-gaze,pupilR))*eye;
  col=mix(col,vec3(.13,.075,.095),pupil);
  float glint=mask(ellipse(ep-gaze-vec2(-1.0,1.4),vec2(1.4,min(1.4,height*.3))));
  col=mix(col,vec3(1.,.99,1.),glint*pupil);
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
  float arch=.85*(1.-squared(bx/7.4));float slope=side*uDetails.x*.32;
  float brow=mask(length(vec2(b.x-bx,b.y-arch-slope*bx))-.92);
  col=mix(col,ink,brow);
  if(uFloodTime>=98.){
    float death=smoothstep(98.,103.,uFloodTime);
    // Clear the closing eyelid, then draw two broad stepped diagonals.
    float eyePatch=mask(ellipse(ep,vec2(9.6,10.8)));
    col=mix(col,gold,eyePatch*death);
    float crossed=max(
      stroke(ep,vec2(-5.,-5.),vec2(5.,5.),1.7),
      stroke(ep,vec2(-5.,5.),vec2(5.,-5.),1.7));
    col=mix(col,ink,crossed*death);
  }
 }
 vec3 eyesAndBrows=col;
 vec2 m=(q-vec2(0,-8.5))/vec2(uDetails.w,1.);
 float opening=uExpression.z,smile=uExpression.y;
 if(uRoutine.y>0.){m.x*=3.;opening=.3;smile=0.;}
 float width=mix(8.8,11.6,smoothstep(.1,.65,opening));width=mix(width,4.6,smoothstep(.78,1.,opening));
 float curve=smile*(4.3*squared(m.x/max(width,1.))-1.8);
 vec2 mp=vec2(m.x,m.y-curve),mr=vec2(width,.48+opening*5.0);
 float mouth=mask(ellipse(mp,mr));
 col=mix(col,mix(ink,vec3(.95,.035,.24),uRoutine.y),mouth);
 float teeth=mask(max(abs(mp.x)-width*.83,abs(mp.y-mr.y*.64)-(.38+opening*.5)))*mouth*smoothstep(.28,.5,opening)*(1.-smoothstep(.8,1.,opening));
 col=mix(col,vec3(1.,.98,.88),teeth);
 float tongue=mask(ellipse(mp+vec2(0.,mr.y*.73),vec2(width*.56,max(.4,mr.y*.32))))*mouth*smoothstep(.4,.6,opening)*(1.-smoothstep(.85,1.,opening));
 col=mix(col,vec3(1.,.27,.36),tongue);
 float cheek=exp(-squared((abs(q.x)-23.)/3.3)-squared((q.y+4.)/2.4));
 col=mix(col,vec3(1.,.28,.19),cheek*.08*max(smile,0.));
 col=mix(col,eyesAndBrows,uEscape.y);
 }

 if(f>0. && uRoutine.z>.01){
   float stride=floor(uRoutine.w*24.)*.9;
   // Pumping arms, flying sweat and broken wind streaks follow the face.
   for(int sideIndex=0;sideIndex<2;sideIndex++){
     float side=sideIndex==0?-1.:1.;
     vec2 shoulder=vec2(side*23.,-9.);
     vec2 elbow=shoulder+vec2(side*(5.+2.*cos(stride)), -5.+5.*sin(stride+side*PI*.5));
     vec2 fist=elbow+vec2(-side*5.,6.);
     float arm=max(stroke(q,shoulder,elbow,1.5),stroke(q,elbow,fist,1.5));
     col=mix(col,ink,arm*uRoutine.z);
     if(length(q-fist)<2.5)col=mix(col,vec3(1.,.88,.43),uRoutine.z);
     vec2 sweat=q-vec2(side*25.,10.-mod(uRoutine.w*22.+side*9.,23.));
     if(abs(sweat.x)<1.2 && abs(sweat.y)<2.)col=mix(col,vec3(.24,.8,1.),uRoutine.z);
   }
   if(abs(q.x)>26. && abs(q.x)<41. && abs(q.y)<22.){
     float wind=step(.78,fract(q.y*.15))*step(.3,fract(q.x*.07+uRoutine.w*3.));
     col=mix(col,vec3(1.,.95,.67),wind*uRoutine.z);
   }

   // Opposing thigh and shin angles keep both feet legible at a sprint.
   for(int leg=0;leg<2;leg++){
     float side=leg==0?-1.:1.;
     float cycle=floor(uRoutine.w*32.)*.9+float(leg)*PI;
     vec2 hip=vec2(side*4.,-16.);
     vec2 knee=hip+vec2(7.*sin(cycle),-7.+3.*cos(cycle));
     vec2 foot=knee+vec2(8.*sin(cycle-.95),-5.+3.*cos(cycle-.95));
     float limb=max(stroke(q,hip,knee,1.8),stroke(q,knee,foot,1.6));
     col=mix(col,ink,limb*uRoutine.z);
     vec2 shoe=q-foot-vec2(1.8,0.);
     if(abs(shoe.y)<2.1 && abs(shoe.x)<4.5)col=mix(col,shoe.y<-.7?vec3(1.,.92,.68):vec3(.82,.09,.05),uRoutine.z);
     vec2 exhaust=q-foot+vec2(7.,0.);
     vec4 jet=arcadeFlame(vec2(exhaust.y/5.,(4.-exhaust.x)/12.),cycle);
     col=mix(col,jet.rgb,jet.a*uRoutine.z);
   }
 }
 if(f>0. && uRoutine.x>0.){
   vec2 blush=vec2(abs(q.x)-21.,q.y+4.);
   if(abs(blush.x)<3.5 && abs(blush.y)<1.8)col=mix(col,vec3(1.,.27,.32),uRoutine.x*.7);
 }
 if(f>0. && heat>.1){
   float crease=max(stroke(q,vec2(-2.,13.),vec2(0.,11.),.6),stroke(q,vec2(2.,13.),vec2(0.,11.),.6));
   col=mix(col,ink,crease*heat);
 }
 if(f>0. && uRoutine.y>0.){
   float kiss=uRoutine.y;
   vec2 lips=(q-vec2(0.,-9.))/vec2(mix(14.,8.,kiss),mix(3.,6.,kiss));
   lips.y-=.18*cos(lips.x*5.);
   if(dot(lips,lips)<1.)col=abs(lips.y)<.16?ink:(lips.y>.0?vec3(.91,.09,.22):vec3(1.,.29,.39));
   vec2 hand=vec2(22.,-14.+2.*kiss);
   vec2 bud=hand+vec2(4.,15.);
   if(stroke(q,hand,bud,1.)>.5||stroke(q,hand+vec2(2.,6.),hand+vec2(-2.,9.),1.4)>.5)col=vec3(.13,.42,.19);
   vec2 petal=q-bud;
   if(abs(petal.x)+abs(petal.y)*.8<5.)col=petal.y>1.?vec3(1.,.27,.36):vec3(.72,.02,.13);
   if(stroke(q,bud-vec2(2.,0.),bud+vec2(.4,-1.),.65)>.5)col=vec3(.40,.015,.07);
   if(stroke(q,hand-vec2(5.,3.),hand,2.4)>.5)col=ink;
   if(length(q-hand)<3.5)col=vec3(1.,.89,.57);
 }
 col=mix(dryBackground,col,uEscape.x);
 if(uScene.x==5. && uFloodTime<0.){
   float reveal=smoothstep(0.,.52,uScene.y)*(1.-smoothstep(26.5,28.,uScene.y));
   col=mix(col,echoStory(rd,uScene.y),reveal);
 }
 if(uScene.x==4. && uFloodTime<0.){
   float reveal=smoothstep(0.,.65,uScene.y)*(1.-smoothstep(22.7,24.,uScene.y));
   col=mix(col,roseStory(rd,uScene.y),reveal);
 }
 if(uFloodTime>=0.){
  col=mix(col,dryBackground,smoothstep(104.,113.,uFloodTime));
  col=floodWater(col,rd,uFloodTime,waterDepth);
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
