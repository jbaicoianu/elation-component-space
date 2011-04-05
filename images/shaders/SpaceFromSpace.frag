//
// Atmospheric scattering fragment shader
//
// Author: Sean O'Neil
//
// Copyright (c) 2004 Sean O'Neil
//

uniform sampler2D s2Test;

varying vec3 c0;

void main (void)
{
	//gl_FragColor = gl_SecondaryColor * texture2D(s2Test, gl_TexCoord[0].st);
	//gl_FragColor = gl_SecondaryColor;
  gl_FragColor = vec4(c0, 1.0);
}
