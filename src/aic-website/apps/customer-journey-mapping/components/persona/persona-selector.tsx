'use client';

import React from 'react';
import { usePersona } from '@/contexts/persona-context';
import { useJourney } from '@/contexts/journey-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Users, Plus } from 'lucide-react';

export function PersonaSelector() {
  const { personas, currentPersona, setCurrentPersona } = usePersona();
  const { journeys, setCurrentJourney } = useJourney();

  const handlePersonaChange = (persona: any) => {
    setCurrentPersona(persona);
    
    // Find and set the journey for this persona
    const personaJourney = journeys.find(j => j.personaId === persona.id);
    if (personaJourney) {
      setCurrentJourney(personaJourney);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          {currentPersona ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentPersona.avatar} alt={currentPersona.name} />
                <AvatarFallback>
                  {currentPersona.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span>{currentPersona.name}</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              <span>Select Persona</span>
            </>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Customer Personas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {personas.map((persona) => (
          <DropdownMenuItem
            key={persona.id}
            onClick={() => handlePersonaChange(persona)}
            className="p-3"
          >
            <div className="flex items-start space-x-3 w-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={persona.avatar} alt={persona.name} />
                <AvatarFallback>
                  {persona.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{persona.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    persona.status === 'active' ? 'bg-green-100 text-green-800' :
                    persona.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {persona.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">{persona.title}</p>
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{persona.demographics.companySize}</span>
                  <span>{persona.demographics.industry}</span>
                  <span>{persona.metrics.conversionRate.toFixed(1)}% conversion</span>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="p-3">
          <div className="flex items-center space-x-2 w-full text-primary-600">
            <Plus className="h-4 w-4" />
            <span>Create New Persona</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
