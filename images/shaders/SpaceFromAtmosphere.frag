//
// Atmospheric scattering fragment shader
//
// Author: Sean O'Neil
//
// Copyright (c) 2004 Sean O'Neil
//
// Ported for use with three.js/WebGL by James Baicoianu

uniform sampler2D tSkyboxDiffuse;

varying vec3 c0;
varying vec2 vUv;

void main (void)
{
	//gl_FragColor = gl_SecondaryColor * texture2D(s2Test, gl_TexCoord[0].st);
	//gl_FragColor = gl_SecondaryColor;
  vec4 diffuseTex = texture2D( tSkyboxDiffuse, vUv );
	gl_FragColor = vec4(c0 * diffuseTex.rgb, 1.0);
}
