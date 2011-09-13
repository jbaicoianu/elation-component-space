//
// Atmospheric scattering fragment shader
//
// Author: Sean O'Neil
//
// Copyright (c) 2004 Sean O'Neil
//
// Ported for use with three.js/WebGL by James Baicoianu

//uniform sampler2D s2Tex1;
//uniform sampler2D s2Tex2;
uniform vec3 v3LightPosition;
uniform sampler2D tDiffuse;

varying vec3 cFront;
varying vec3 cSecondary;
varying vec3 vNormal;
varying vec2 vUv;

void main (void)
{
	//gl_FragColor = vec4(c0, 1.0);
	//gl_FragColor = vec4(0.25 * c0, 1.0);
	//gl_FragColor = gl_Color + texture2D(s2Tex1, gl_TexCoord[0].st) * texture2D(s2Tex2, gl_TexCoord[1].st) * gl_SecondaryColor;
  vec3 diffuseTex = texture2D( tDiffuse, vUv ).xyz;
  float phong = dot(normalize(vNormal), normalize(v3LightPosition));
  gl_FragColor = vec4( cFront + (diffuseTex * phong) * cSecondary, 1.0 );
  //gl_FragColor = vec4(cFront + (diffuseTex * phong * cSecondary), 1.0);
  //gl_FragColor = vec4( cFront, 1.0) + vec4(diffuseTex * phong, 1.0);
  //gl_FragColor = vec4(cFront + (diffuseTex * phong) + (0.05 * cSecondary), 1.0);
}
