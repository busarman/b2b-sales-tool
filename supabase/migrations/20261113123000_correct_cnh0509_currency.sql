-- Owner-confirmed on 2026-11-13: the source's 225000 RUB is 225000 EUR.
-- Only this exact machine and amount are covered; future different prices are not guessed.
create or replace function public.correct_cnh0509_currency()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.external_id = 'CNH_0509'
    and new.serial_number = 'HACT7260CTG421603'
    and new.model = 'T7.260'
    and new.price_with_vat = 225000
    and new.contract_currency = 'RUB' then
    new.contract_currency := 'EUR';
  end if;
  return new;
end;
$$;
revoke all on function public.correct_cnh0509_currency() from public;
drop trigger if exists correct_cnh0509_currency on public.inventory;
create trigger correct_cnh0509_currency before insert or update on public.inventory
for each row execute function public.correct_cnh0509_currency();
update public.inventory set contract_currency = 'EUR'
where external_id = 'CNH_0509' and serial_number = 'HACT7260CTG421603'
  and model = 'T7.260' and price_with_vat = 225000 and contract_currency = 'RUB';
