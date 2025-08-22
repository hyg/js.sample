#!/usr/bin/env node
import React from 'react';
import { render, Text, Box } from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
		Usage
		  $ raw

		Options
			--name  Your name

		Examples
		  $ raw --name=Jane
		  Hello, Jane
	`,
	{
		importMeta: import.meta,
	},
);

//render(<App name={cli.flags.name} />);
const features = ['Feature 1', 'Feature 2', 'Feature 3'];
const FeatureList = ({ items }) => (
<Box flexDirection="column" marginTop={1}>
{items.map((item, index) => (
<Text key={index}>- {item}</Text>
))}
</Box>
);

const MyCLI = () => (
<Box flexDirection="column" padding={1}>
<Text bold color="blue">Welcome to My CLI Tool</Text>
<Text>This is a simple demonstration of building a CLI with Ink and JSX.</Text>
<Box flexDirection="column" marginTop={1}>
<Text>- Feature 1: Does something cool</Text>
<Text>- Feature 2: Does something even cooler</Text>
<Text>- Feature 3: You guessed it, the coolest</Text>
<FeatureList items={features} />
</Box>
</Box>
);
render(<MyCLI />);
